"""
Dedalus-powered case generation routes.
Generates realistic clinical cases from medical literature.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.services.dedalus_agent import get_dedalus_agent
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/api/dedalus", tags=["dedalus"])


class CaseGenerationRequest(BaseModel):
    medical_condition: str
    difficulty: Optional[str] = "medium"


class CaseGenerationResponse(BaseModel):
    case: dict
    source: str = "dedalus"
    literature_reference: Optional[str] = None


@router.post("/generate-case", response_model=dict)
async def generate_case_from_literature(request: CaseGenerationRequest):
    """
    Generate a realistic patient case from medical literature using Dedalus.
    
    Args:
        request: Contains medical_condition and optional difficulty
        
    Returns:
        Generated case with real literature findings
    """
    try:
        if not request.medical_condition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="medical_condition is required"
            )
        
        # Generate case using Dedalus agent
        agent = get_dedalus_agent()
        case = await agent.generate_case_from_literature(
            medical_condition=request.medical_condition,
            difficulty=request.difficulty
        )
        
        if not case:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate case from literature"
            )
        
        # Optionally save generated case to Supabase
        # await supabase_service.create_case(case)
        
        return {
            "case": case,
            "source": "dedalus",
            "literature_reference": case.get("literature_reference"),
            "message": f"Generated realistic case for {request.medical_condition} from medical literature"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating case: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate case: {str(e)}"
        )


@router.post("/search-literature")
async def search_medical_literature(query: str, max_results: int = 5):
    """
    Search medical literature (PubMed) for a query.
    
    Args:
        query: Search query
        max_results: Maximum results to return
        
    Returns:
        List of literature search results
    """
    try:
        if not query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="query is required"
            )
        
        agent = get_dedalus_agent()
        results = await agent.search_pubmed(query, max_results)
        
        return {
            "query": query,
            "results": results,
            "count": len(results),
            "source": "pubmed"
        }
        
    except Exception as e:
        print(f"Error searching literature: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search literature: {str(e)}"
        )
