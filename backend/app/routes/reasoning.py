"""
Clinical reasoning interaction routes.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from uuid import UUID
from typing import Optional
import uuid
from app.models.interaction import InteractionResponse
from app.services.elevenlabs_service import elevenlabs_service
from app.services.supabase_service import supabase_service
from app.services.reasoning_engine import reasoning_engine
from app.utils.validators import validate_audio_file, validate_text_input

router = APIRouter()


@router.post("/interact", response_model=InteractionResponse)
async def interact(
    session_id: str = Form(...),
    audio_file: Optional[UploadFile] = File(None),
    text_input: Optional[str] = Form(None)
):
    """
    Process student input (audio or text) and generate tutor response.
    
    This is the main endpoint for clinical reasoning interactions.
    Supports both voice and text input.
    
    Args:
        session_id: Session UUID (form field)
        audio_file: Optional audio file upload
        text_input: Optional text input (if no audio)
        
    Returns:
        InteractionResponse with tutor's Socratic response
    """
    print("\n" + "="*80)
    print("🎙️  AUDIO INTERACTION REQUEST RECEIVED")
    print(f"Session ID: {session_id}")
    print(f"Has audio file: {audio_file is not None}")
    print(f"Has text input: {text_input is not None}")
    print("="*80)
    
    try:
        # Validate session ID
        print("📋 Step 1: Validating session ID...")
        try:
            session_uuid = UUID(session_id)
            print(f"   ✓ Valid UUID: {session_uuid}")
        except ValueError:
            print(f"   ✗ Invalid session ID format: {session_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID format"
            )
        
        # Check if session exists
        print("🔍 Step 2: Checking if session exists...")
        session = await supabase_service.get_session(session_uuid)
        if not session:
            print(f"   ✗ Session not found: {session_uuid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        print(f"   ✓ Session found: {session.case_id}")
        
        # Check session is active
        print(f"📊 Step 3: Checking session status...")
        if session.status != "active":
            print(f"   ✗ Session is {session.status}, not active")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Session is {session.status}, not active"
            )
        print(f"   ✓ Session is active")
        
        # Get student input (transcribe audio or use text)
        student_input_text = ""
        audio_url = None
        
        if audio_file:
            print(f"🎵 Step 4: Processing audio file...")
            print(f"   File name: {audio_file.filename}")
            print(f"   Content type: {audio_file.content_type}")
            
            # Validate audio file
            validate_audio_file(audio_file)
            print(f"   ✓ Audio file validated")
            
            # Read audio data
            audio_data = await audio_file.read()
            print(f"   ✓ Audio data read: {len(audio_data)} bytes")
            
            # Transcribe audio using AssemblyAI
            print("🎤 Step 5: Transcribing audio with AssemblyAI...")
            try:
                transcription_result = await elevenlabs_service.transcribe_audio(audio_data)
                if not transcription_result.get("success"):
                    error_msg = transcription_result.get("error", "Unknown transcription error")
                    print(f"   ✗ Transcription failed: {error_msg}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to transcribe audio: {error_msg}"
                    )
                student_input_text = transcription_result.get("transcript", "")
                if not student_input_text or student_input_text.strip() == "":
                    print(f"   ✗ Transcription resulted in empty text")
                    print(f"   Possible causes:")
                    print(f"      1. Audio recording was too short (try 2-3 seconds minimum)")
                    print(f"      2. No speech detected (check microphone)")
                    print(f"      3. Audio volume too low (speak louder/closer to mic)")
                    print(f"      4. Background noise only")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No speech detected in audio. Please try recording again and speak clearly for at least 2-3 seconds."
                    )
                print(f"   ✓ Transcription successful")
                print(f"   📝 Transcript: {student_input_text[:100]}..." if len(student_input_text) > 100 else f"   📝 Transcript: {student_input_text}")
            except HTTPException:
                raise
            except Exception as e:
                print(f"   ✗ Transcription error: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to transcribe audio: {str(e)}"
                )
            
            # Upload audio to storage (non-blocking, don't fail if this fails)
            print("💾 Step 6: Uploading student audio to storage...")
            try:
                audio_filename = f"student_{uuid.uuid4()}.mp3"
                audio_url = await supabase_service.upload_audio(
                    file_data=audio_data,
                    session_id=session_uuid,
                    filename=audio_filename,
                    content_type=audio_file.content_type or "audio/mpeg"
                )
                print(f"   ✓ Audio uploaded: {audio_url}")
            except Exception as e:
                print(f"   ⚠️  Warning: Failed to upload audio: {str(e)}")
        
        elif text_input:
            print(f"✍️  Step 4: Using text input...")
            # Use text input
            validate_text_input(text_input)
            student_input_text = text_input
            print(f"   ✓ Text input: {student_input_text[:100]}..." if len(student_input_text) > 100 else f"   ✓ Text input: {student_input_text}")
        
        else:
            print("   ✗ No input provided")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either audio_file or text_input must be provided"
            )
        
        # Generate tutor response using reasoning engine
        print("🤖 Step 7: Generating tutor response with K2...")
        try:
            response_data = await reasoning_engine.generate_response(
                session_id=session_uuid,
                student_input=student_input_text
            )
            
            tutor_response = response_data["tutor_response"]
            reasoning_metadata = response_data["reasoning_metadata"]
            print(f"   ✓ K2 response generated")
            print(f"   📝 Response: {tutor_response[:100]}..." if len(tutor_response) > 100 else f"   📝 Response: {tutor_response}")
            
        except Exception as e:
            print(f"   ✗ K2 reasoning error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate response: {str(e)}"
            )
        
        # Generate speech for response (using ElevenLabs TTS)
        print("🔊 Step 8: Generating TTS audio with ElevenLabs...")
        response_audio_url = None
        try:
            from app.config import get_settings
            import re
            settings = get_settings()
            
            # Clean the response text for TTS
            # Remove XML tags like <think>...</think> that K2 includes
            clean_text = tutor_response
            print(f"   Original text length: {len(clean_text)} chars")
            
            # Remove <think> blocks (K2 reasoning tags)
            clean_text = re.sub(r'<think>.*?</think>', '', clean_text, flags=re.DOTALL)
            
            # Remove any other XML-like tags
            clean_text = re.sub(r'<[^>]+>', '', clean_text)
            
            # Trim whitespace and normalize
            clean_text = clean_text.strip()
            
            # Replace multiple spaces/newlines with single space
            clean_text = re.sub(r'\s+', ' ', clean_text)
            
            print(f"   Cleaned text length: {len(clean_text)} chars")
            print(f"   Cleaned text preview: {clean_text[:200]}..." if len(clean_text) > 200 else f"   Cleaned text: {clean_text}")
            
            if not clean_text:
                print(f"   ⚠️  Warning: Cleaned text is empty, skipping TTS")
                raise ValueError("Cleaned text is empty after removing XML tags")
            
            # Validate text length (ElevenLabs limit is ~5000 chars)
            if len(clean_text) > 5000:
                print(f"   ⚠️  Warning: Text too long ({len(clean_text)} chars), truncating to 5000")
                clean_text = clean_text[:4997] + "..."
            
            response_audio_bytes = await elevenlabs_service.generate_voice(
                text=clean_text,
                voice_id=settings.elevenlabs_voice_id
            )
            
            if response_audio_bytes:
                print(f"   ✓ TTS audio generated: {len(response_audio_bytes)} bytes")
                # Upload response audio to Supabase storage
                print("💾 Step 9: Uploading response audio to storage...")
                response_audio_filename = f"tutor_{uuid.uuid4()}.mp3"
                response_audio_url = await supabase_service.upload_audio(
                    file_data=response_audio_bytes,
                    session_id=session_uuid,
                    filename=response_audio_filename,
                    content_type="audio/mpeg"
                )
                print(f"   ✓ Response audio uploaded: {response_audio_url}")
            else:
                print(f"   ⚠️  Warning: TTS audio generation returned empty bytes")
        except Exception as e:
            print(f"   ⚠️  Warning: Failed to generate/upload response audio: {str(e)}")
            # Continue without audio - text response is still returned
        
        # Save interaction to database
        print("💾 Step 10: Saving interaction to database...")
        try:
            await supabase_service.save_interaction(
                session_id=session_uuid,
                student_input=student_input_text,
                tutor_response=tutor_response,
                audio_url=audio_url,
                response_audio_url=response_audio_url,
                reasoning_metadata=reasoning_metadata
            )
            print(f"   ✓ Interaction saved")
        except Exception as e:
            print(f"   ⚠️  Warning: Failed to save interaction: {str(e)}")
            # Continue even if save fails
        
        # Clean response for frontend display (remove XML tags like <think>)
        print("🧹 Step 11: Cleaning response for display...")
        display_response = tutor_response
        # Remove <think> tags and content (K2 reasoning blocks)
        display_response = re.sub(r'<think>.*?</think>', '', display_response, flags=re.DOTALL)
        # Remove any other XML-like tags
        display_response = re.sub(r'<[^>]+>', '', display_response)
        # Normalize whitespace
        display_response = re.sub(r'\s+', ' ', display_response).strip()
        
        print(f"   Original length: {len(tutor_response)} chars")
        print(f"   Cleaned length: {len(display_response)} chars")
        print(f"   Display response preview: {display_response[:150]}..." if len(display_response) > 150 else f"   Display response: {display_response}")
        
        # Return response
        print("✅ Step 12: Returning response to client")
        print("="*80 + "\n")
        return InteractionResponse(
            student_input=student_input_text,
            tutor_response=display_response,  # Send cleaned response to frontend
            audio_url=response_audio_url,
            reasoning_metadata=reasoning_metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n❌ FATAL ERROR in interact endpoint:")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        import traceback
        print(f"   Traceback:")
        traceback.print_exc()
        print("="*80 + "\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process interaction: {str(e)}"
        )
