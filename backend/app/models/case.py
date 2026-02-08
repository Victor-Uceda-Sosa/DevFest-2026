from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class CaseBase(BaseModel):
    """Base model for clinical case."""
    title: str
    chief_complaint: str
    clinical_scenario: Dict[str, Any]
    differential_diagnoses: Dict[str, Any]
    correct_diagnosis: Optional[str] = None  # The correct/primary diagnosis for evaluation
    red_flags: list[str]
    learning_objectives: list[str]


class CaseCreate(CaseBase):
    """Model for creating a new case."""
    pass


class Case(CaseBase):
    """Complete case model with database fields."""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class CasePublic(BaseModel):
    """Public case info (no spoilers for students)."""
    id: UUID
    title: str
    chief_complaint: str
    learning_objectives: list[str]
    
    class Config:
        from_attributes = True
