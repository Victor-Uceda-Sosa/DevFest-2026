"""
Session management routes.
"""
from fastapi import APIRouter, HTTPException, status
from uuid import UUID
from app.models.session import SessionCreate, Session, SessionStatus
from app.services.supabase_service import supabase_service
from app.services.reasoning_engine import reasoning_engine
from app.utils.validators import validate_student_id
from datetime import datetime

router = APIRouter()


def _is_valid_uuid(val: str) -> bool:
    """Check if a string is a valid UUID."""
    try:
        UUID(val)
        return True
    except (ValueError, AttributeError, TypeError):
        return False


@router.post("/start", response_model=dict, status_code=status.HTTP_201_CREATED)
async def start_session(session_data: SessionCreate):
    """
    Start a new clinical reasoning session.
    
    Args:
        session_data: Session creation data (case_id, student_id)
        
    Returns:
        Session info and initial greeting
    """
    try:
        # Validate student ID
        validate_student_id(session_data.student_id)

        # Check if this is a demo case (non-UUID string ID)
        is_demo_case = not _is_valid_uuid(session_data.case_id)
        case = None

        if is_demo_case:
            # For demo cases, create an in-memory session without database persistence
            session_id = str(UUID(int=0))  # Dummy session ID for demo
            case_id = session_data.case_id
            session_status = "active"
            started_at = datetime.now()
            print(f"📌 Demo case session created in-memory for {case_id}")
        else:
            # For real cases from database
            case_uuid = UUID(session_data.case_id)
            case = await supabase_service.get_case(case_uuid)
            if not case:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Clinical case not found"
                )

            # Create session in database
            session = await supabase_service.create_session(
                case_id=case_uuid,
                student_id=session_data.student_id,
                metadata=session_data.metadata
            )
            session_id = str(session.id)
            case_id = str(session.case_id)
            session_status = session.status
            started_at = session.started_at

        # Generate initial greeting
        if is_demo_case:
            # For demo cases, use a generic greeting since we don't have case data
            initial_greeting = "Hi, thanks for seeing me. I'm not sure what's going on and would appreciate your help figuring this out."
            print(f"📌 Using generic greeting for demo case")
        else:
            # For real cases, generate context-aware greeting
            initial_greeting = await reasoning_engine.generate_initial_greeting(
                case_id=case_uuid
            )

        # Generate TTS audio for initial greeting
        from app.config import get_settings
        from app.services.elevenlabs_service import elevenlabs_service
        import base64

        greeting_audio_url = None
        try:
            settings = get_settings()
            greeting_audio_bytes = await elevenlabs_service.generate_voice(
                text=initial_greeting,
                voice_id=settings.elevenlabs_voice_id
            )
            if greeting_audio_bytes:
                # Return as base64 data URL
                audio_base64 = base64.b64encode(greeting_audio_bytes).decode('utf-8')
                greeting_audio_url = f"data:audio/mpeg;base64,{audio_base64}"
        except Exception as e:
            print(f"⚠️  Failed to generate greeting audio: {str(e)}")

        # Build response with case info if available
        response = {
            "session_id": session_id,
            "case_id": case_id,
            "status": session_status,
            "started_at": started_at.isoformat(),
            "initial_greeting": initial_greeting,
            "greeting_audio_url": greeting_audio_url
        }

        # Only include case_info if we have a case object (real cases from database)
        if case:
            response["case_info"] = {
                "title": case.title,
                "chief_complaint": case.chief_complaint,
                "learning_objectives": case.learning_objectives
            }

        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start session: {str(e)}"
        )


@router.get("/{session_id}", response_model=dict)
async def get_session(session_id: UUID):
    """
    Get session details and interaction history.
    
    Args:
        session_id: Session UUID
        
    Returns:
        Session data with full interaction history
    """
    try:
        # Get session
        session = await supabase_service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Get interactions
        interactions = await supabase_service.get_session_history(session_id)
        
        # Get case info
        case = await supabase_service.get_case(session.case_id)
        
        return {
            "session_id": str(session.id),
            "case_id": str(session.case_id),
            "student_id": session.student_id,
            "status": session.status,
            "started_at": session.started_at.isoformat(),
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "case_title": case.title if case else "Unknown",
            "interaction_count": len(interactions),
            "interactions": [
                {
                    "interaction_number": i.interaction_number,
                    "student_input": i.student_input,
                    "tutor_response": i.tutor_response,
                    "timestamp": i.timestamp.isoformat(),
                    "reasoning_metadata": i.reasoning_metadata
                }
                for i in interactions
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session: {str(e)}"
        )


@router.post("/{session_id}/complete", response_model=dict)
async def complete_session(session_id: UUID):
    """
    Mark a session as completed and get evaluation.
    
    Args:
        session_id: Session UUID
        
    Returns:
        Session evaluation and summary
    """
    try:
        # Check if session exists
        session = await supabase_service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Update status
        updated_session = await supabase_service.update_session_status(
            session_id=session_id,
            status=SessionStatus.COMPLETED
        )
        
        # Get evaluation
        evaluation = await reasoning_engine.evaluate_session(session_id)
        print(f"✅ Evaluation returned: {evaluation}")

        response = {
            "session_id": str(session_id),
            "status": updated_session.status,
            "completed_at": updated_session.completed_at.isoformat() if updated_session.completed_at else None,
            "evaluation": evaluation.get("evaluation"),
            "summary": evaluation.get("summary")
        }
        print(f"📋 Final response: {response}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error completing session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete session: {str(e)}"
        )
