"""
Reasoning engine that orchestrates Socratic clinical reasoning sessions.
"""
from typing import Dict, Any, List, Optional
from uuid import UUID
from app.services.kimi_service import kimi_service
from app.services.supabase_service import supabase_service
from app.utils.prompt_templates import (
    format_system_prompt,
    format_interaction_prompt,
    format_initial_greeting
)


class ReasoningEngine:
    """
    Orchestrates the Socratic clinical reasoning process.
    Combines Kimi K2 Thinking, session context, and pedagogical strategies.
    """
    
    async def generate_initial_greeting(self, case_id: UUID) -> str:
        """
        Generate initial greeting for a new session.
        
        Args:
            case_id: Clinical case UUID
            
        Returns:
            Initial greeting text
        """
        # Get case details
        case = await supabase_service.get_case(case_id)
        if not case:
            raise Exception("Case not found")
        
        # Format initial prompt
        initial_prompt = format_initial_greeting(
            case_description=str(case.clinical_scenario),
            chief_complaint=case.chief_complaint,
            learning_objectives=case.learning_objectives
        )
        
        # Query Kimi for initial greeting
        system_prompt = format_system_prompt(
            case_description=str(case.clinical_scenario),
            chief_complaint=case.chief_complaint
        )
        
        result = await kimi_service.query_k2_thinking(
            system_prompt=system_prompt,
            user_message=initial_prompt,
            temperature=0.8
        )
        
        return result["response"]
    
    async def generate_response(
        self,
        session_id: UUID,
        student_input: str
    ) -> Dict[str, Any]:
        """
        Generate tutor response to student input using Socratic method.
        
        Args:
            session_id: Session UUID
            student_input: Student's question or response
            
        Returns:
            Dictionary containing:
            - tutor_response: The Socratic response text
            - reasoning_metadata: Metadata about the reasoning process
        """
        # Load session and case context
        session = await supabase_service.get_session(session_id)
        if not session:
            raise Exception("Session not found")
        
        case = await supabase_service.get_case(session.case_id)
        if not case:
            raise Exception("Case not found")
        
        # Load conversation history
        interactions = await supabase_service.get_session_history(session_id)
        
        # Format conversation history for Kimi
        conversation_history = self._build_conversation_history(interactions)
        
        # Prepare case context
        case_context = {
            "clinical_scenario": case.clinical_scenario,
            "chief_complaint": case.chief_complaint,
            "differential_diagnoses": case.differential_diagnoses,
            "red_flags": case.red_flags
        }
        
        # Use Kimi to analyze and respond
        result = await kimi_service.analyze_clinical_reasoning(
            student_input=student_input,
            case_context=case_context,
            conversation_history=conversation_history
        )
        
        # Enhance metadata with case-specific analysis
        reasoning_metadata = result["reasoning_metadata"]
        reasoning_metadata.update(
            self._analyze_student_reasoning(
                student_input=student_input,
                case=case,
                previous_interactions=interactions
            )
        )
        
        return {
            "tutor_response": result["tutor_response"],
            "reasoning_metadata": reasoning_metadata
        }
    
    def _build_conversation_history(
        self,
        interactions: List[Any]
    ) -> List[Dict[str, str]]:
        """
        Build conversation history in format expected by Kimi.
        
        Args:
            interactions: List of Interaction objects
            
        Returns:
            List of message dictionaries
        """
        history = []
        
        for interaction in interactions:
            # Add student message
            history.append({
                "role": "user",
                "content": interaction.student_input
            })
            
            # Add tutor response
            history.append({
                "role": "assistant",
                "content": interaction.tutor_response
            })
        
        return history
    
    def _analyze_student_reasoning(
        self,
        student_input: str,
        case: Any,
        previous_interactions: List[Any]
    ) -> Dict[str, Any]:
        """
        Analyze student's clinical reasoning against case expectations.
        
        Args:
            student_input: Current student input
            case: Case object
            previous_interactions: Previous interactions
            
        Returns:
            Analysis metadata
        """
        metadata = {
            "interaction_count": len(previous_interactions) + 1,
            "identified_red_flags": [],
            "considered_diagnoses": [],
            "cognitive_biases_noted": []
        }
        
        # Simple keyword analysis for red flags
        student_lower = student_input.lower()
        for red_flag in case.red_flags:
            if any(word in student_lower for word in red_flag.lower().split()):
                metadata["identified_red_flags"].append(red_flag)
        
        # Check for differential diagnoses mentioned
        if isinstance(case.differential_diagnoses, dict):
            for diagnosis in case.differential_diagnoses.keys():
                if diagnosis.lower() in student_lower:
                    metadata["considered_diagnoses"].append(diagnosis)
        
        return metadata
    
    async def evaluate_session(
        self,
        session_id: UUID
    ) -> Dict[str, Any]:
        """
        Evaluate a student's overall performance in a session.
        
        Args:
            session_id: Session UUID
            
        Returns:
            Evaluation summary
        """
        # Load session data
        session = await supabase_service.get_session(session_id)
        if not session:
            raise Exception("Session not found")
        
        case = await supabase_service.get_case(session.case_id)
        interactions = await supabase_service.get_session_history(session_id)
        
        # Collect all red flags and diagnoses mentioned
        all_red_flags = set()
        all_diagnoses = set()
        
        for interaction in interactions:
            metadata = interaction.reasoning_metadata or {}
            all_red_flags.update(metadata.get("identified_red_flags", []))
            all_diagnoses.update(metadata.get("considered_diagnoses", []))
        
        # Calculate coverage
        total_red_flags = len(case.red_flags) if case else 0
        identified_red_flags = len(all_red_flags)
        
        return {
            "total_interactions": len(interactions),
            "red_flags_identified": list(all_red_flags),
            "red_flags_coverage": f"{identified_red_flags}/{total_red_flags}",
            "diagnoses_considered": list(all_diagnoses),
            "session_duration_minutes": self._calculate_duration(interactions)
        }
    
    def _calculate_duration(self, interactions: List[Any]) -> int:
        """Calculate session duration in minutes."""
        if not interactions or len(interactions) < 2:
            return 0
        
        start_time = interactions[0].timestamp
        end_time = interactions[-1].timestamp
        
        duration = (end_time - start_time).total_seconds() / 60
        return int(duration)


# Global reasoning engine instance
reasoning_engine = ReasoningEngine()
