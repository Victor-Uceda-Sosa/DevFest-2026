from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class InteractionCreate(BaseModel):
    """Model for creating a new interaction."""
    session_id: UUID
    student_input: str
    audio_url: Optional[str] = None


class InteractionResponse(BaseModel):
    """Response from a reasoning interaction."""
    student_input: str
    tutor_response: str
    audio_url: Optional[str] = None
    reasoning_metadata: Dict[str, Any] = {}


class Interaction(BaseModel):
    """Complete interaction model with database fields."""
    id: UUID
    session_id: UUID
    interaction_number: int
    student_input: str
    audio_url: Optional[str] = None
    tutor_response: str
    response_audio_url: Optional[str] = None
    reasoning_metadata: Dict[str, Any] = {}
    timestamp: datetime
    
    class Config:
        from_attributes = True
