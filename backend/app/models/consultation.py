from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ConsultationBase(BaseModel):
    case_id: str
    case_title: str


class ConsultationCreate(ConsultationBase):
    pass


class ConsultationUpdate(BaseModel):
    transcript: Optional[str] = None
    feedback: Optional[dict] = None
    empathy_score: Optional[float] = None
    clarity_score: Optional[float] = None
    completeness_score: Optional[float] = None
    missed_questions: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    status: Optional[str] = None
    completed_at: Optional[datetime] = None


class ConsultationResponse(ConsultationBase):
    id: str
    user_id: str
    audio_url: Optional[str]
    transcript: Optional[str]
    duration_seconds: Optional[int]
    feedback: Optional[dict]
    empathy_score: Optional[float]
    clarity_score: Optional[float]
    completeness_score: Optional[float]
    missed_questions: Optional[List[str]]
    strengths: Optional[List[str]]
    weaknesses: Optional[List[str]]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class CaseResponse(BaseModel):
    case_id: str
    case_title: str
    description: str
    difficulty: str
