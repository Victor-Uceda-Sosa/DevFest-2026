"""
Routes for Reddit-based case generation.
Allows generating realistic patient cases from Reddit health posts.
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import logging
from app.services.reddit_scraper import reddit_scraper
from app.services.case_generator import case_generator
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate-from-reddit")
async def generate_cases_from_reddit(
    limit: int = 5,
    subreddits: Optional[List[str]] = None,
    time_filter: str = "month"
):
    """
    Generate medical cases from Reddit health posts.

    Args:
        limit: Number of posts to scrape
        subreddits: Which subreddits to scrape (defaults to popular health ones)
        time_filter: Time period (hour, day, week, month, year, all)

    Returns:
        Generated cases ready for student consultations
    """
    try:
        if not reddit_scraper.reddit:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Reddit API not configured. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env"
            )

        logger.info(f"🔍 Generating cases from Reddit (limit: {limit})...")

        # Fetch posts from Reddit
        posts = await reddit_scraper.fetch_health_posts(
            subreddits=subreddits,
            limit=limit * 3,  # Fetch more to account for filtering
            time_filter=time_filter
        )

        if not posts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No posts found from Reddit"
            )

        generated_cases = []

        # Process each post
        for post in posts:
            if len(generated_cases) >= limit:
                break

            logger.info(f"Processing post: {post['title'][:50]}...")

            # Get comments for context
            comments = await reddit_scraper.get_post_comments(post["id"], limit=3)

            # Generate case from post
            case_data = await case_generator.generate_case_from_post(post, comments)

            if case_data:
                # Enhance personality from writing style
                case_data = await case_generator.enhance_personality_from_post(case_data, post)

                # Store in database
                try:
                    stored_case = await supabase_service.create_case(case_data)
                    generated_cases.append({
                        "id": stored_case.id,
                        "title": case_data.get("title"),
                        "chief_complaint": case_data.get("chief_complaint"),
                        "source": "reddit",
                        "source_url": post.get("url"),
                        "safety_check": case_data.get("safety_check")
                    })
                    logger.info(f"✅ Stored case: {case_data.get('title')}")
                except Exception as e:
                    logger.error(f"Failed to store case: {e}")
                    continue

        logger.info(f"✅ Generated {len(generated_cases)} cases from Reddit")

        return {
            "success": True,
            "count": len(generated_cases),
            "cases": generated_cases,
            "message": f"Generated {len(generated_cases)} patient cases from Reddit"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating cases: {e}")
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
