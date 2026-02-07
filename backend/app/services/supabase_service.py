"""
Supabase service for database operations and file storage.
"""
from supabase import create_client, Client
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from app.config import settings
from app.models.case import Case, CaseCreate
from app.models.session import Session, SessionCreate, SessionStatus
from app.models.interaction import Interaction


class SupabaseService:
    """Service for Supabase database and storage operations."""
    
    def __init__(self):
        """Initialize Supabase client."""
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
    
    # ========== Case Operations ==========
    
    async def get_case(self, case_id: UUID) -> Optional[Case]:
        """
        Get a clinical case by ID.
        
        Args:
            case_id: Case UUID
            
        Returns:
            Case object or None if not found
        """
        try:
            response = self.client.table("cases").select("*").eq("id", str(case_id)).execute()
            
            if response.data and len(response.data) > 0:
                return Case(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error fetching case: {str(e)}")
            raise
    
    async def list_cases(self, limit: int = 50) -> List[Case]:
        """
        List all available clinical cases.
        
        Args:
            limit: Maximum number of cases to return
            
        Returns:
            List of Case objects
        """
        try:
            response = self.client.table("cases").select("*").limit(limit).execute()
            return [Case(**case_data) for case_data in response.data]
            
        except Exception as e:
            print(f"Error listing cases: {str(e)}")
            raise
    
    async def create_case(self, case_data: CaseCreate) -> Case:
        """
        Create a new clinical case.
        
        Args:
            case_data: Case creation data
            
        Returns:
            Created Case object
        """
        try:
            response = self.client.table("cases").insert(case_data.model_dump()).execute()
            
            if response.data and len(response.data) > 0:
                return Case(**response.data[0])
            raise Exception("Failed to create case")
            
        except Exception as e:
            print(f"Error creating case: {str(e)}")
            raise
    
    # ========== Session Operations ==========
    
    async def create_session(self, case_id: UUID, student_id: str, metadata: Optional[Dict[str, Any]] = None) -> Session:
        """
        Create a new reasoning session.
        
        Args:
            case_id: Case UUID
            student_id: Student identifier
            metadata: Optional session metadata
            
        Returns:
            Created Session object
        """
        try:
            session_data = {
                "case_id": str(case_id),
                "student_id": student_id,
                "status": SessionStatus.ACTIVE.value,
                "metadata": metadata or {}
            }
            
            response = self.client.table("sessions").insert(session_data).execute()
            
            if response.data and len(response.data) > 0:
                return Session(**response.data[0])
            raise Exception("Failed to create session")
            
        except Exception as e:
            print(f"Error creating session: {str(e)}")
            raise
    
    async def get_session(self, session_id: UUID) -> Optional[Session]:
        """
        Get a session by ID.
        
        Args:
            session_id: Session UUID
            
        Returns:
            Session object or None if not found
        """
        try:
            response = self.client.table("sessions").select("*").eq("id", str(session_id)).execute()
            
            if response.data and len(response.data) > 0:
                return Session(**response.data[0])
            return None
            
        except Exception as e:
            print(f"Error fetching session: {str(e)}")
            raise
    
    async def update_session_status(self, session_id: UUID, status: SessionStatus) -> Session:
        """
        Update session status.
        
        Args:
            session_id: Session UUID
            status: New session status
            
        Returns:
            Updated Session object
        """
        try:
            update_data = {"status": status.value}
            
            if status == SessionStatus.COMPLETED:
                update_data["completed_at"] = datetime.utcnow().isoformat()
            
            response = self.client.table("sessions").update(update_data).eq("id", str(session_id)).execute()
            
            if response.data and len(response.data) > 0:
                return Session(**response.data[0])
            raise Exception("Failed to update session")
            
        except Exception as e:
            print(f"Error updating session: {str(e)}")
            raise
    
    async def get_session_history(self, session_id: UUID, limit: int = 50) -> List[Interaction]:
        """
        Get interaction history for a session.
        
        Args:
            session_id: Session UUID
            limit: Maximum number of interactions to return
            
        Returns:
            List of Interaction objects
        """
        try:
            response = (
                self.client.table("interactions")
                .select("*")
                .eq("session_id", str(session_id))
                .order("interaction_number", desc=False)
                .limit(limit)
                .execute()
            )
            
            return [Interaction(**interaction_data) for interaction_data in response.data]
            
        except Exception as e:
            print(f"Error fetching session history: {str(e)}")
            raise
    
    # ========== Interaction Operations ==========
    
    async def save_interaction(
        self,
        session_id: UUID,
        student_input: str,
        tutor_response: str,
        audio_url: Optional[str] = None,
        response_audio_url: Optional[str] = None,
        reasoning_metadata: Optional[Dict[str, Any]] = None
    ) -> Interaction:
        """
        Save a student-tutor interaction.
        
        Args:
            session_id: Session UUID
            student_input: Student's input text
            tutor_response: Tutor's response text
            audio_url: Optional URL to student audio
            response_audio_url: Optional URL to response audio
            reasoning_metadata: Optional reasoning metadata
            
        Returns:
            Created Interaction object
        """
        try:
            # Get current interaction count
            count_response = (
                self.client.table("interactions")
                .select("interaction_number", count="exact")
                .eq("session_id", str(session_id))
                .execute()
            )
            
            interaction_number = len(count_response.data) + 1
            
            interaction_data = {
                "session_id": str(session_id),
                "interaction_number": interaction_number,
                "student_input": student_input,
                "tutor_response": tutor_response,
                "audio_url": audio_url,
                "response_audio_url": response_audio_url,
                "reasoning_metadata": reasoning_metadata or {}
            }
            
            response = self.client.table("interactions").insert(interaction_data).execute()
            
            if response.data and len(response.data) > 0:
                return Interaction(**response.data[0])
            raise Exception("Failed to save interaction")
            
        except Exception as e:
            print(f"Error saving interaction: {str(e)}")
            raise
    
    # ========== Storage Operations ==========
    
    async def upload_audio(
        self,
        file_data: bytes,
        session_id: UUID,
        filename: str,
        content_type: str = "audio/mpeg"
    ) -> str:
        """
        Upload audio file to Supabase Storage.
        
        Args:
            file_data: Audio file bytes
            session_id: Session UUID (used for organizing files)
            filename: File name
            content_type: MIME type
            
        Returns:
            Public URL of uploaded file
        """
        try:
            bucket_name = "audio-files"
            file_path = f"{session_id}/{filename}"
            
            # Upload file
            response = self.client.storage.from_(bucket_name).upload(
                file_path,
                file_data,
                {"content-type": content_type}
            )
            
            # Get public URL
            public_url = self.client.storage.from_(bucket_name).get_public_url(file_path)
            
            return public_url
            
        except Exception as e:
            print(f"Error uploading audio: {str(e)}")
            # Don't fail the whole request if audio upload fails
            return ""


# Global service instance
supabase_service = SupabaseService()
