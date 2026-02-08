"""
Case generator that converts Reddit posts into realistic patient scenarios.
Uses Claude to extract patient data and SafetyKit to filter for appropriate content.
"""

import logging
import json
import httpx
from typing import Dict, Any, Optional, List
import anthropic
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SafetyKitFilter:
    """Filters content using SafetyKit API for fraud/abuse detection."""

    def __init__(self):
        """Initialize SafetyKit client."""
        self.api_key = settings.safetykit_api_key if hasattr(settings, 'safetykit_api_key') else None
        self.api_base = "https://api.safetykit.com"  # Example - check actual API docs
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        } if self.api_key else None

    async def check_content_safety(self, text: str) -> Dict[str, Any]:
        """
        Check if content is appropriate using SafetyKit.

        Returns:
            {
                "is_safe": bool,
                "risk_level": "low" | "medium" | "high",
                "flags": list of detected issues,
                "confidence": float
            }
        """
        if not self.headers:
            logger.warning("SafetyKit API key not configured - skipping safety check")
            return {
                "is_safe": True,
                "risk_level": "unknown",
                "flags": [],
                "confidence": 0.0
            }

        try:
            # Note: Actual SafetyKit endpoint may differ - check their API docs
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.api_base}/content/check",
                    headers=self.headers,
                    json={
                        "text": text,
                        "categories": ["fraud", "abuse", "harmful", "misinformation"]
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "is_safe": data.get("is_safe", True),
                        "risk_level": data.get("risk_level", "low"),
                        "flags": data.get("flags", []),
                        "confidence": data.get("confidence", 0.0)
                    }
                else:
                    logger.warning(f"SafetyKit API returned {response.status_code}")
                    return {
                        "is_safe": True,
                        "risk_level": "unknown",
                        "flags": [],
                        "confidence": 0.0
                    }

        except Exception as e:
            logger.error(f"SafetyKit error: {e}")
            # Fallback to safe by default
            return {
                "is_safe": True,
                "risk_level": "unknown",
                "flags": [],
                "confidence": 0.0
            }


class CaseGenerator:
    """Generates patient cases from Reddit posts using Claude."""

    def __init__(self):
        """Initialize with Claude and SafetyKit clients."""
        self.claude_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.safety_filter = SafetyKitFilter()

    async def generate_case_from_post(
        self,
        reddit_post: Dict[str, Any],
        comments: Optional[List[Dict[str, str]]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Convert a Reddit post into a medical case scenario.

        Args:
            reddit_post: Post data from Reddit scraper
            comments: Optional comments for additional context

        Returns:
            Case object or None if filtered out
        """
        try:
            # Check safety first
            combined_text = reddit_post["title"] + "\n" + reddit_post["body"]
            if comments:
                combined_text += "\n" + "\n".join([c["body"] for c in comments[:3]])

            safety_check = await self.safety_filter.check_content_safety(combined_text)

            if not safety_check["is_safe"]:
                logger.warning(f"Post {reddit_post['id']} flagged as unsafe: {safety_check['flags']}")
                return None

            # Use Claude to extract patient data
            case_data = await self._extract_patient_data(reddit_post, comments)

            if not case_data:
                logger.warning(f"Failed to extract patient data from post {reddit_post['id']}")
                return None

            # Add safety metadata
            case_data["safety_check"] = safety_check

            logger.info(f"✅ Generated case from post {reddit_post['id']}: {case_data.get('title')}")
            return case_data

        except Exception as e:
            logger.error(f"Error generating case from post: {e}")
            return None

    async def _extract_patient_data(
        self,
        reddit_post: Dict[str, Any],
        comments: Optional[List[Dict[str, str]]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Use Claude to extract structured patient data from Reddit post.
        """
        try:
            # Build prompt for Claude
            comments_text = ""
            if comments:
                comments_text = "\n\nRELEVANT COMMENTS:\n" + "\n".join([
                    f"- {c['body']}" for c in comments[:3]
                ])

            prompt = f"""Extract medical case information from this Reddit post. Focus on what would be clinically relevant for a student doctor to diagnose.

REDDIT POST:
Title: {reddit_post['title']}
Body: {reddit_post['body']}
{comments_text}

Extract and return ONLY valid JSON (no markdown, no extra text) with this exact structure:

{{
  "title": "Brief case title (e.g., 'Chest Pain in Middle-Aged Male')",
  "chief_complaint": "Main symptom/reason for visit",
  "clinical_scenario": {{
    "patient_info": {{
      "name": "Patient Name or 'John' if not specified",
      "age": 35,
      "gender": "M/F/Other or 'Unknown'",
      "occupation": "occupation if mentioned or null"
    }},
    "symptoms": ["symptom 1", "symptom 2"],
    "medical_history": ["condition 1", "condition 2"],
    "current_medications": ["medication 1"] or [],
    "timeline": "When did symptoms start?",
    "social_history": "smoking, alcohol, drugs if mentioned",
    "writing_style": "Brief description of how the patient communicates - formal, anxious, casual, etc"
  }},
  "differential_diagnoses": {{
    "likely_diagnosis_1": "Brief description of why this fits",
    "likely_diagnosis_2": "Brief description"
  }},
  "red_flags": ["critical finding 1", "critical finding 2"],
  "learning_objectives": ["What should student learn from this case?"],
  "source": "reddit",
  "original_url": "{reddit_post['url']}"
}}

IMPORTANT:
- Be realistic - if age not mentioned, set to null or "Unknown"
- Extract actual symptoms mentioned, not assumptions
- Identify real red flags that a doctor should ask about
- Focus on what a student doctor should diagnose
- Make sure differential diagnoses match the presenting symptoms
"""

            message = self.claude_client.messages.create(
                model="claude-opus-4-6",  # Use more capable model for extraction
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Extract JSON from response
            response_text = message.content[0].text.strip()

            # Try to parse JSON
            try:
                # Remove markdown code blocks if present
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]

                case_data = json.loads(response_text.strip())
                return case_data

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Claude response as JSON: {e}")
                logger.error(f"Response was: {response_text[:200]}")
                return None

        except Exception as e:
            logger.error(f"Error extracting patient data with Claude: {e}")
            return None

    async def enhance_personality_from_post(
        self,
        case_data: Dict[str, Any],
        reddit_post: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Use Claude to enhance patient persona personality from Reddit post writing style.
        """
        try:
            prompt = f"""Based on this Reddit post, describe the patient's personality and communication style in 2-3 sentences.

REDDIT POST:
{reddit_post['body'][:500]}

Return ONLY a valid JSON object (no markdown):
{{
  "personality": "One sentence about their personality",
  "communication_style": "One sentence about how they communicate",
  "emotional_state": "One sentence about their emotional state (anxious, calm, frustrated, etc)"
}}"""

            message = self.claude_client.messages.create(
                model="claude-haiku-4-5-20251001",  # Fast, cheap model for enhancement
                max_tokens=300,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text.strip()

            # Parse JSON
            if "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            personality_data = json.loads(response_text.strip())

            # Add to clinical_scenario
            case_data["clinical_scenario"]["personality"] = personality_data

            return case_data

        except Exception as e:
            logger.warning(f"Could not enhance personality: {e}")
            return case_data


# Initialize generator
case_generator = CaseGenerator()
