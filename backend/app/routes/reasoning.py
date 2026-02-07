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
    try:
        # Validate session ID
        try:
            session_uuid = UUID(session_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID format"
            )
        
        # Check if session exists
        session = await supabase_service.get_session(session_uuid)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Check session is active
        if session.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Session is {session.status}, not active"
            )
        
        # Get student input (transcribe audio or use text)
        student_input_text = ""
        audio_url = None
        
        if audio_file:
            # Validate audio file
            validate_audio_file(audio_file)
            
            # Read audio data
            audio_data = await audio_file.read()
            
            # Transcribe audio using AssemblyAI
            try:
                transcription_result = await elevenlabs_service.transcribe_audio(audio_data)
                if not transcription_result.get("success"):
                    error_msg = transcription_result.get("error", "Unknown transcription error")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to transcribe audio: {error_msg}"
                    )
                student_input_text = transcription_result.get("transcript", "")
                if not student_input_text:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Transcription resulted in empty text"
                    )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to transcribe audio: {str(e)}"
                )
            
            # Upload audio to storage (non-blocking, don't fail if this fails)
            try:
                audio_filename = f"student_{uuid.uuid4()}.mp3"
                audio_url = await supabase_service.upload_audio(
                    file_data=audio_data,
                    session_id=session_uuid,
                    filename=audio_filename,
                    content_type=audio_file.content_type or "audio/mpeg"
                )
            except Exception as e:
                print(f"Warning: Failed to upload audio: {str(e)}")
        
        elif text_input:
            # Use text input
            validate_text_input(text_input)
            student_input_text = text_input
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either audio_file or text_input must be provided"
            )
        
        # Generate tutor response using reasoning engine
        try:
            response_data = await reasoning_engine.generate_response(
                session_id=session_uuid,
                student_input=student_input_text
            )
            
            tutor_response = response_data["tutor_response"]
            reasoning_metadata = response_data["reasoning_metadata"]
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate response: {str(e)}"
            )
        
        # Generate speech for response (using ElevenLabs TTS)
        response_audio_url = None
        try:
            from app.config import get_settings
            settings = get_settings()
            
            response_audio_bytes = await elevenlabs_service.generate_voice(
                text=tutor_response,
                voice_id=settings.elevenlabs_voice_id
            )
            
            if response_audio_bytes:
                # Upload response audio to Supabase storage
                response_audio_filename = f"tutor_{uuid.uuid4()}.mp3"
                response_audio_url = await supabase_service.upload_audio(
                    file_data=response_audio_bytes,
                    session_id=session_uuid,
                    filename=response_audio_filename,
                    content_type="audio/mpeg"
                )
        except Exception as e:
            print(f"Warning: Failed to generate/upload response audio: {str(e)}")
            # Continue without audio - text response is still returned
        
        # Save interaction to database
        try:
            await supabase_service.save_interaction(
                session_id=session_uuid,
                student_input=student_input_text,
                tutor_response=tutor_response,
                audio_url=audio_url,
                response_audio_url=response_audio_url,
                reasoning_metadata=reasoning_metadata
            )
        except Exception as e:
            print(f"Warning: Failed to save interaction: {str(e)}")
            # Continue even if save fails
        
        # Return response
        return InteractionResponse(
            student_input=student_input_text,
            tutor_response=tutor_response,
            audio_url=response_audio_url,
            reasoning_metadata=reasoning_metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in interact endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process interaction: {str(e)}"
        )
