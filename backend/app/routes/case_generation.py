"""
Routes for K2 + ChromaDB case generation.
Generates realistic medical cases using K2 AI informed by medical knowledge base.
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import logging
from app.services.k2_case_generator import k2_case_generator
from app.services.chroma_service import chroma_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/init-knowledge-base")
async def initialize_knowledge_base():
    """
    Initialize ChromaDB with medical knowledge base.
    Only needs to run once.
    """
    try:
        logger.info("📚 Initializing medical knowledge base...")
        await chroma_service.seed_common_conditions()

        return {
            "success": True,
            "message": "Medical knowledge base initialized with common conditions"
        }

    except Exception as e:
        logger.error(f"Error initializing knowledge base: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize knowledge base: {str(e)}"
        )


@router.post("/generate-with-k2")
async def generate_cases_with_k2(
    condition: str,
    limit: int = 1,
    difficulty: str = "medium"
):
    """
    Generate medical cases using K2 AI informed by medical knowledge base.

    Args:
        condition: Medical condition to generate case for (e.g., "Acute Chest Pain")
        limit: Number of cases to generate
        difficulty: Case difficulty (easy, medium, hard)

    Returns:
        Generated cases ready for student consultations
    """
    try:
        if difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Difficulty must be: easy, medium, or hard"
            )

        logger.info(f"🧠 Generating {limit} case(s) for: {condition} (difficulty: {difficulty})...")

        generated_cases = []

        # Generate cases
        for i in range(limit):
            logger.info(f"Generating case {i+1}/{limit}...")

            # Use K2 to generate case
            case_data = await k2_case_generator.generate_case(condition, difficulty)

            if case_data:
                # Store in database
                try:
                    stored_case = await supabase_service.create_case(case_data)
                    generated_cases.append({
                        "id": str(stored_case.id),
                        "title": case_data.get("title"),
                        "chief_complaint": case_data.get("chief_complaint"),
                        "source": "k2_generated",
                        "medical_condition": condition,
                        "difficulty": difficulty
                    })
                    logger.info(f"✅ Stored case: {case_data.get('title')}")
                except Exception as e:
                    logger.error(f"Failed to store case: {e}")
                    continue
            else:
                logger.warning(f"Failed to generate case {i+1}")

        if not generated_cases:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate any cases for {condition}"
            )

        logger.info(f"✅ Generated and stored {len(generated_cases)} cases")

        return {
            "success": True,
            "count": len(generated_cases),
            "condition": condition,
            "difficulty": difficulty,
            "cases": generated_cases,
            "message": f"Generated {len(generated_cases)} patient case(s) for {condition}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating cases: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cases: {str(e)}"
        )


@router.get("/available")
async def get_available_cases():
    """
    Get list of available cases for consultation.
    Student will pick one and select difficulty level.
    """
    try:
        cases = await supabase_service.list_cases(limit=50)

        return {
            "success": True,
            "count": len(cases),
            "cases": [
                {
                    "id": str(case.id),
                    "title": case.title,
                    "chief_complaint": case.chief_complaint,
                    "learning_objectives": case.learning_objectives,
                    "source": case.metadata.get("source", "manual") if hasattr(case, 'metadata') else "manual"
                }
                for case in cases
            ]
        }

    except Exception as e:
        logger.error(f"Error fetching cases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cases: {str(e)}"
        )
