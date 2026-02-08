from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.auth.dependencies import get_current_user
from app.database import get_supabase
from app.models.consultation import (
    ConsultationCreate,
    ConsultationResponse,
    CaseResponse,
)
from app.services.elevenlabs_service import elevenlabs_service
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Hardcoded standardized cases for medical students
STANDARDIZED_CASES = [
    {
        "case_id": "case_001",
        "case_title": "Acute Chest Pain",
        "description": "A 45-year-old male presents with acute chest pain for 2 hours",
        "difficulty": "intermediate",
    },
    {
        "case_id": "case_002",
        "case_title": "Persistent Cough",
        "description": "A 52-year-old female with a 3-week persistent cough",
        "difficulty": "intermediate",
    },
    {
        "case_id": "case_003",
        "case_title": "Abdominal Pain",
        "description": "A 28-year-old female presenting with acute abdominal pain",
        "difficulty": "beginner",
    },
    {
        "case_id": "case_004",
        "case_title": "Dizziness and Syncope",
        "description": "A 68-year-old male with episodes of dizziness and brief syncope",
        "difficulty": "advanced",
    },
    {
        "case_id": "case_005",
        "case_title": "Fever and Rash",
        "description": "A 6-year-old child with fever and generalized rash",
        "difficulty": "intermediate",
    },
]


@router.get("/cases", response_model=list[CaseResponse])
async def get_cases():
    """Get list of available standardized cases"""
    return STANDARDIZED_CASES


@router.post("/start-simple")
async def start_consultation_simple(
    case_id: str,
    difficulty: str = "medium",
    user=Depends(get_current_user)
):
    """
    Simplified consultation start - user only selects case and difficulty.
    Everything else is auto-generated from case data.

    Args:
        case_id: UUID of the case to use
        difficulty: Level of difficulty (easy, medium, hard)
        user: Current authenticated user
    """
    try:
        from app.services.supabase_service import supabase_service

        # Fetch the case
        case = await supabase_service.get_case(case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case {case_id} not found"
            )

        # Create consultation
        consultation_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        # Store with case data + difficulty
        result = get_supabase().table("consultations").insert(
            {
                "id": consultation_id,
                "user_id": user.id,
                "case_id": str(case.id),
                "case_title": case.title,
                "chief_complaint": case.chief_complaint,
                "difficulty": difficulty,
                "case_data": {
                    "clinical_scenario": case.clinical_scenario,
                    "differential_diagnoses": case.differential_diagnoses,
                    "red_flags": case.red_flags,
                    "learning_objectives": case.learning_objectives,
                },
                "status": "in_progress",
                "created_at": now,
            }
        ).execute()

        if result.data:
            return {
                "success": True,
                "consultation_id": consultation_id,
                "case_id": str(case.id),
                "case_title": case.title,
                "chief_complaint": case.chief_complaint,
                "difficulty": difficulty,
                "message": f"Consultation started with {difficulty} difficulty"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create consultation",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting consultation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting consultation: {str(e)}",
        )


@router.post("/start", response_model=ConsultationResponse)
async def start_consultation(
    consultation: ConsultationCreate, user=Depends(get_current_user)
):
    """Start a new consultation session"""
    print(f"\n=== START CONSULTATION ENDPOINT CALLED ===")
    try:
        print(f"DEBUG: User authenticated: {user}")
        print(f"DEBUG: User ID: {user.id if user else 'None'}")
        print(f"DEBUG: Case ID: {consultation.case_id}")
        print(f"DEBUG: Case Title: {consultation.case_title}")

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated",
            )

        # Create consultation record in database
        consultation_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        print(f"DEBUG: Attempting to insert into database with user_id={user.id}")
        result = get_supabase().table("consultations").insert(
            {
                "id": consultation_id,
                "user_id": user.id,
                "case_id": consultation.case_id,
                "case_title": consultation.case_title,
                "status": "in_progress",
                "created_at": now,
            }
        ).execute()

        print(f"DEBUG: Insert result: {result}")
        if result.data:
            print(f"DEBUG: Consultation created successfully: {result.data[0]}")
            return result.data[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create consultation",
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting consultation: {str(e)}",
        )


@router.post("/{consultation_id}/audio")
async def upload_audio(
    consultation_id: str, file: UploadFile = File(...), user=Depends(get_current_user)
):
    """Upload audio and get transcription"""
    print(f"\n=== UPLOAD AUDIO ENDPOINT CALLED ===")
    print(f"Consultation ID: {consultation_id}")
    print(f"User ID: {user.id}")
    print(f"File: {file.filename}, Content-Type: {file.content_type}")

    try:
        # Read audio file
        audio_data = await file.read()
        print(f"DEBUG: Received audio file, size: {len(audio_data)} bytes")

        # Transcribe using OpenAI Whisper
        transcription_result = await elevenlabs_service.transcribe_audio(audio_data)
        print(f"DEBUG: Transcription result: {transcription_result}")

        if not transcription_result.get("success"):
            error_msg = transcription_result.get("error", "Unknown error")
            print(f"ERROR: Transcription failed: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to transcribe audio: {error_msg}",
            )

        transcript = transcription_result.get("transcript", "")
        duration = transcription_result.get("duration_seconds", 0)

        # Print transcript to terminal
        print("\n" + "="*80)
        print(f"TRANSCRIPTION RESULT:")
        print(f"Duration: {duration} seconds")
        print(f"Transcript: {transcript}")
        print("="*80 + "\n")

        # Update consultation with transcript
        update_result = get_supabase().table("consultations").update(
            {
                "transcript": transcript,
                "duration_seconds": duration,
                "status": "transcribed",
            }
        ).eq("id", consultation_id).eq("user_id", user.id).execute()

        if update_result.data:
            return {
                "success": True,
                "transcript": transcript,
                "duration_seconds": duration,
                "consultation_id": consultation_id,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultation not found",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading audio: {str(e)}",
        )


@router.get("/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation(consultation_id: str, user=Depends(get_current_user)):
    """Get consultation details"""
    try:
        result = get_supabase().table("consultations").select("*").eq(
            "id", consultation_id
        ).eq("user_id", user.id).execute()

        if result.data and len(result.data) > 0:
            return result.data[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultation not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching consultation: {str(e)}",
        )


@router.get("/", response_model=list[ConsultationResponse])
async def list_consultations(user=Depends(get_current_user)):
    """List all consultations for current user"""
    try:
        result = get_supabase().table("consultations").select("*").eq(
            "user_id", user.id
        ).order("created_at", desc=True).execute()

        return result.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching consultations: {str(e)}",
        )
