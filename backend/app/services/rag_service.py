"""
RAG (Retrieval-Augmented Generation) Service using Featherless AI (K2).
Retrieves relevant medical knowledge and uses K2 to synthesize context-aware responses.
"""

import logging
from typing import List, Dict, Optional, Any
import json
from app.config import get_settings
from app.services.kimi_service import kimi_service
from app.utils.prompts import get_rag_context_prompt

logger = logging.getLogger(__name__)
settings = get_settings()


class RAGService:
    """
    Provides Retrieval-Augmented Generation using K2 for medical consultation.

    In the future, this will integrate with vector DB (Chroma/Pinecone).
    For now, uses case data as knowledge base.
    """

    def __init__(self):
        """Initialize RAG service with K2 client"""
        self.kimi = kimi_service

    async def retrieve_relevant_knowledge(
        self,
        case_data: Dict[str, Any],
        query: str
    ) -> List[str]:
        """
        Retrieve relevant medical knowledge for a query.

        Currently extracts knowledge from case data.
        In future: Would query ChromaDB vector database.

        Args:
            case_data: The clinical case data
            query: The student doctor's question

        Returns:
            List of relevant knowledge chunks
        """
        retrieved = []

        # Extract knowledge from case structure
        clinical_scenario = case_data.get("clinical_scenario", {})
        differential_diagnoses = case_data.get("differential_diagnoses", {})
        red_flags = case_data.get("red_flags", [])
        learning_objectives = case_data.get("learning_objectives", [])

        # Simple keyword matching (future: replace with semantic search)
        query_lower = query.lower()

        # Add chief complaint context
        chief_complaint = case_data.get("chief_complaint", "")
        if chief_complaint:
            retrieved.append(f"Chief Complaint: {chief_complaint}")

        # Add relevant differential diagnoses
        if differential_diagnoses:
            if isinstance(differential_diagnoses, dict):
                diagnoses_text = "\n".join([
                    f"- {name}: {details}" if isinstance(details, str) else f"- {name}: {json.dumps(details)}"
                    for name, details in differential_diagnoses.items()
                ])
                retrieved.append(f"Differential Diagnoses:\n{diagnoses_text}")
            else:
                retrieved.append(f"Differential Diagnoses: {differential_diagnoses}")

        # Add red flags if asking about specific findings
        if red_flags:
            red_flags_text = "\n".join([f"- {flag}" for flag in red_flags])
            retrieved.append(f"Critical Red Flags to Monitor:\n{red_flags_text}")

        # Add relevant symptoms/findings from scenario
        if "symptoms" in clinical_scenario:
            symptoms = clinical_scenario["symptoms"]
            if isinstance(symptoms, list):
                symptoms_text = "\n".join([f"- {symptom}" for symptom in symptoms])
                retrieved.append(f"Presenting Symptoms:\n{symptoms_text}")

        # Add learning objectives
        if learning_objectives:
            objectives_text = "\n".join([f"- {obj}" for obj in learning_objectives])
            retrieved.append(f"Learning Objectives:\n{objectives_text}")

        logger.info(f"Retrieved {len(retrieved)} knowledge chunks for query: {query[:50]}...")
        return retrieved

    async def synthesize_response(
        self,
        case_data: Dict[str, Any],
        query: str,
        patient_persona: Dict[str, Any],
        include_rag: bool = True
    ) -> str:
        """
        Use K2 to synthesize a natural response to a student doctor's question.

        Args:
            case_data: The clinical case data
            query: The student doctor's question
            patient_persona: Patient persona information
            include_rag: Whether to use RAG context (default True)

        Returns:
            The synthesized response from K2
        """
        try:
            # Retrieve relevant knowledge from case
            knowledge = []
            if include_rag:
                knowledge = await self.retrieve_relevant_knowledge(case_data, query)
                logger.info(f"RAG retrieved {len(knowledge)} knowledge chunks")

            # Build RAG-enhanced prompt
            rag_prompt = get_rag_context_prompt(query, knowledge)

            # Get K2 to synthesize response
            logger.info(f"Synthesizing K2 response for: {query[:50]}...")
            response = await self.kimi.complete(
                messages=[
                    {
                        "role": "user",
                        "content": rag_prompt
                    }
                ],
                max_tokens=500,
                temperature=0.3  # Lower temperature for consistency
            )

            # Extract response text
            response_text = response.get("content", "") if isinstance(response, dict) else str(response)

            logger.info(f"K2 synthesis complete: {response_text[:100]}...")
            return response_text

        except Exception as e:
            logger.error(f"Error synthesizing response: {e}", exc_info=True)
            # Fallback to simple knowledge concatenation
            fallback = "I need to consider the clinical presentation more carefully. Could you tell me more about..."
            return fallback

    async def get_hints_for_student(
        self,
        case_data: Dict[str, Any],
        current_diagnosis: str,
        difficulty: str = "medium"
    ) -> str:
        """
        Generate Socratic hints to guide student thinking.

        Args:
            case_data: The clinical case data
            current_diagnosis: What the student has proposed
            difficulty: Difficulty level (easy, medium, hard)

        Returns:
            Hints to guide the student
        """
        try:
            differential_diagnoses = case_data.get("differential_diagnoses", {})
            red_flags = case_data.get("red_flags", [])

            hint_prompt = f"""The student has proposed this diagnosis: "{current_diagnosis}"

Given the case:
- Differential Diagnoses: {differential_diagnoses}
- Critical Red Flags: {red_flags}

Provide 2-3 guiding questions to help them think more comprehensively about:
1. What other diagnoses should they consider?
2. What additional findings would help confirm/rule out diagnoses?
3. Are there any red flags they might have missed?

Make the hints appropriately challenging for {difficulty} difficulty level."""

            response = await self.kimi.complete(
                messages=[
                    {
                        "role": "user",
                        "content": hint_prompt
                    }
                ],
                max_tokens=300,
                temperature=0.3
            )

            hints = response.get("content", "") if isinstance(response, dict) else str(response)
            logger.info(f"Generated hints: {hints[:100]}...")
            return hints

        except Exception as e:
            logger.error(f"Error generating hints: {e}", exc_info=True)
            return "Consider reviewing the patient's presenting symptoms and what red flags you might have missed."


# Initialize service
rag_service = RAGService()
