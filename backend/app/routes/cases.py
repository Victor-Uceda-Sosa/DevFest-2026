"""
Clinical case management routes.
"""
from fastapi import APIRouter, HTTPException, status
from uuid import UUID
from typing import List
from app.models.case import Case, CaseCreate, CasePublic
from app.services.supabase_service import supabase_service

router = APIRouter()


@router.get("", response_model=List[CasePublic])
async def list_cases(limit: int = 50):
    """
    List all available clinical cases.
    Returns public info only (no spoilers).
    
    Args:
        limit: Maximum number of cases to return (default 50)
        
    Returns:
        List of case summaries
    """
    try:
        cases = await supabase_service.list_cases(limit=limit)
        
        # Convert to public format (hide answers)
        return [
            CasePublic(
                id=case.id,
                title=case.title,
                chief_complaint=case.chief_complaint,
                learning_objectives=case.learning_objectives
            )
            for case in cases
        ]
        
    except Exception as e:
        print(f"Error listing cases: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list cases: {str(e)}"
        )


@router.get("/{case_id}", response_model=CasePublic)
async def get_case(case_id: UUID):
    """
    Get public details for a specific case.
    Does not return differential diagnoses or red flags (no spoilers).
    
    Args:
        case_id: Case UUID
        
    Returns:
        Case public information
    """
    try:
        case = await supabase_service.get_case(case_id)
        
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
        
        return CasePublic(
            id=case.id,
            title=case.title,
            chief_complaint=case.chief_complaint,
            learning_objectives=case.learning_objectives
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching case: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch case: {str(e)}"
        )


@router.post("", response_model=Case, status_code=status.HTTP_201_CREATED)
async def create_case(case_data: CaseCreate):
    """
    Create a new clinical case.
    
    This is an admin endpoint for creating new cases.
    In production, you'd want to add authentication/authorization.
    
    Args:
        case_data: Complete case data
        
    Returns:
        Created case
    """
    try:
        case = await supabase_service.create_case(case_data)
        return case
        
    except Exception as e:
        print(f"Error creating case: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create case: {str(e)}"
        )
