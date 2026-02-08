"""
K2-powered case generation using ChromaDB for medical knowledge.
Generates realistic patient cases with informed medical context.
"""

import logging
import json
from typing import Dict, Any, Optional
from app.services.kimi_service import kimi_service
from app.services.chroma_service import chroma_service
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class K2CaseGenerator:
    """
    Generates realistic patient cases using K2 (extended thinking)
    informed by medical knowledge from ChromaDB.
    """

    def __init__(self):
        """Initialize with K2 and ChromaDB services."""
        self.kimi = kimi_service
        self.chroma = chroma_service

    async def generate_case(
        self,
        medical_condition: str,
        difficulty: str = "medium"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a complete patient case for a medical condition.

        Args:
            medical_condition: Medical condition (e.g., "Acute Chest Pain")
            difficulty: Case difficulty (easy, medium, hard)

        Returns:
            Complete case object or None if generation fails
        """
        try:
            logger.info(f"🧠 Generating case for: {medical_condition} (difficulty: {difficulty})")

            # Retrieve medical knowledge from ChromaDB
            medical_context = await self.chroma.retrieve_medical_context(
                query=medical_condition,
                top_k=3
            )

            if not medical_context:
                logger.warning(f"No medical knowledge found for {medical_condition}, proceeding without context")
                medical_knowledge = ""
            else:
                medical_knowledge = "\n\n".join([
                    doc["content"] for doc in medical_context
                ])
                logger.info(f"✅ Retrieved {len(medical_context)} medical knowledge documents")

            # Build prompt for K2
            case_prompt = self._build_case_generation_prompt(
                medical_condition,
                difficulty,
                medical_knowledge
            )

            # Use K2 to generate case
            logger.info("🤖 K2 generating patient case...")
            result = await self.kimi.complete(
                messages=[
                    {"role": "user", "content": case_prompt}
                ],
                temperature=0.7,  # Moderate creativity
                max_tokens=2000
            )

            # Parse K2 response
            response_text = result.get("content", "")
            case_data = self._parse_case_response(response_text, medical_condition)

            if not case_data:
                logger.error("Failed to parse K2 response as valid case")
                return None

            logger.info(f"✅ Generated case: {case_data.get('title')}")
            return case_data

        except Exception as e:
            logger.error(f"Error generating case with K2: {e}", exc_info=True)
            return None

    def _build_case_generation_prompt(
        self,
        medical_condition: str,
        difficulty: str,
        medical_knowledge: str
    ) -> str:
        """Build prompt for K2 to generate a patient case."""

        difficulty_traits = {
            "easy": {
                "patient_clarity": "Very clear and articulate",
                "symptom_presentation": "Straightforward and organized",
                "red_flag_obviousness": "Obvious and apparent",
                "complexity": "Simple presentation"
            },
            "medium": {
                "patient_clarity": "Moderately clear with some vagueness",
                "symptom_presentation": "Mix of clear and ambiguous symptoms",
                "red_flag_obviousness": "Some red flags subtle",
                "complexity": "Moderate complexity with multiple considerations"
            },
            "hard": {
                "patient_clarity": "Unclear, anxious, somewhat disorganized",
                "symptom_presentation": "Confusing presentation with atypical features",
                "red_flag_obviousness": "Red flags subtle or easily missed",
                "complexity": "Complex with multiple confounding factors"
            }
        }

        traits = difficulty_traits.get(difficulty, difficulty_traits["medium"])

        return f"""You are an expert medical educator. Generate a realistic, detailed patient case for clinical education.

CONDITION: {medical_condition}

DIFFICULTY LEVEL: {difficulty}

CASE CHARACTERISTICS FOR {difficulty.upper()} DIFFICULTY:
- Patient Clarity: {traits['patient_clarity']}
- Symptom Presentation: {traits['symptom_presentation']}
- Red Flag Obviousness: {traits['red_flag_obviousness']}
- Overall Complexity: {traits['complexity']}

MEDICAL KNOWLEDGE CONTEXT (to inform realistic case generation):
{medical_knowledge if medical_knowledge else "No specific knowledge base available. Generate based on clinical experience."}

INSTRUCTIONS:
Generate a realistic patient case that:
1. Matches the medical condition and difficulty level
2. Uses evidence-based medical information
3. Includes realistic patient demographics and presentation
4. Has appropriate red flags for the difficulty level
5. Is medically accurate and educationally valuable

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:

{{
  "title": "Brief descriptive title (e.g., 'Acute Chest Pain in Middle-Aged Male')",
  "chief_complaint": "Main reason for visit",
  "clinical_scenario": {{
    "patient_info": {{
      "name": "Patient first name or 'John'",
      "age": 45,
      "gender": "M/F/Other",
      "occupation": "Occupation or 'Not specified'"
    }},
    "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
    "medical_history": ["condition 1", "condition 2"],
    "current_medications": ["medication 1"],
    "timeline": "Onset and progression of symptoms",
    "social_history": "Smoking, alcohol, drugs, living situation",
    "writing_style": "Brief description of patient communication style",
    "personality": {{
      "personality": "One sentence about personality",
      "communication_style": "One sentence about how they communicate",
      "emotional_state": "One sentence about emotional state"
    }}
  }},
  "differential_diagnoses": {{
    "primary_diagnosis": "Most likely diagnosis based on presentation",
    "secondary_diagnosis_1": "Other considerations",
    "secondary_diagnosis_2": "Alternative diagnosis"
  }},
  "red_flags": ["critical finding 1", "critical finding 2"],
  "learning_objectives": ["What should student learn from this case?"],
  "clinical_reasoning": "Brief explanation of why this is a good teaching case"
}}

IMPORTANT:
- Be medically accurate and realistic
- Red flags should match difficulty level (obvious for easy, subtle for hard)
- Patient personality should be appropriate for the condition
- Include enough detail for meaningful student interaction
- JSON only - no markdown or explanation"""

    def _parse_case_response(
        self,
        response_text: str,
        medical_condition: str
    ) -> Optional[Dict[str, Any]]:
        """Parse K2 response into a case object."""

        try:
            # Remove markdown if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            # Parse JSON
            case_data = json.loads(response_text.strip())

            # Ensure required fields
            required_fields = ["title", "chief_complaint", "clinical_scenario", "differential_diagnoses"]
            for field in required_fields:
                if field not in case_data:
                    logger.error(f"Missing required field: {field}")
                    return None

            # Add metadata
            case_data["source"] = "k2_generated"
            case_data["medical_condition"] = medical_condition
            case_data["red_flags"] = case_data.get("red_flags", [])
            case_data["learning_objectives"] = case_data.get("learning_objectives", [])

            return case_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse K2 response as JSON: {e}")
            logger.error(f"Response preview: {response_text[:200]}")
            return None
        except Exception as e:
            logger.error(f"Error parsing case response: {e}")
            return None


# Initialize service
k2_case_generator = K2CaseGenerator()
