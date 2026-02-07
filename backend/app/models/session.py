from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


class SessionStatus(str, Enum):
    """Session status enum."""
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class SessionCreate(BaseModel):
    """Model for creating a new session."""
    case_id: UUID
    student_id: str
    metadata: Optional[Dict[str, Any]] = {}


class Session(BaseModel):
    """Complete session model with database fields."""
    id: UUID
    case_id: UUID
    student_id: str
    status: SessionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True


class SessionWithHistory(Session):
    """Session with interaction history."""
    interactions: list[Any] = []  # Will be list[Interaction] but avoiding circular import
