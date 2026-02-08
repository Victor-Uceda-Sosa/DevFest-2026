"""
Reasoning engine that orchestrates Socratic clinical reasoning sessions.
"""
import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from app.services.kimi_service import kimi_service
from app.services.supabase_service import supabase_service
from app.utils.prompt_templates import (
    format_system_prompt,
    format_interaction_prompt,
    format_initial_greeting
)

logger = logging.getLogger(__name__)


class ReasoningEngine:
    """
    Orchestrates the Socratic clinical reasoning process.
    Combines Kimi K2 Thinking, session context, and pedagogical strategies.
    """
    
    async def generate_initial_greeting(self, case_id: UUID) -> str:
        """
        Generate initial greeting for a new session using static template.
        
        This avoids API rate limits by using predefined templates with case context.
        AI responses are still used for all actual interview interactions.
        
        Args:
            case_id: Clinical case UUID
            
        Returns:
            Initial greeting text
        """
        # Get case details
        case = await supabase_service.get_case(case_id)
        if not case:
            raise Exception("Case not found")
        
        # Extract just the symptoms from clinical description
        # Remove clinical prefixes like "22-year-old presents with"
        import re
        symptoms = case.chief_complaint.lower()
        # Remove age/demographic info (e.g., "22-year-old college student presents with")
        symptoms = re.sub(r'^.*?(?:presents with|complains of|reports|with)\s+', '', symptoms)
        # Clean up "for X days" type phrases
        symptoms = re.sub(r'\s+(?:for|over|during)\s+\d+.*?(?=\.|$)', '', symptoms)
        symptoms = symptoms.rstrip('.')

        # Use natural, conversational greetings in first person
        greeting_templates = [
            f"Hi, thanks for seeing me. So I've been having {symptoms} and I'm not sure what's going on.",
            f"Yeah, so I've been dealing with {symptoms}. It started a few days ago and it's been getting worse.",
            f"Um, I'm not really sure what's happening, but I have {symptoms}. I'm kind of worried about it.",
            f"Hey doc, thanks for taking me. So basically I have {symptoms} and I don't know if it's serious or what.",
            f"So I came in today because I've been experiencing {symptoms}. Can you help me figure out what this is?"
        ]
        
        # Select template based on case_id for consistency (same case = same greeting style)
        template_index = int(str(case_id).split('-')[0], 16) % len(greeting_templates)
        greeting = greeting_templates[template_index]
        
        return greeting
    
    async def generate_response(
        self,
        session_id: UUID,
        student_input: str,
        case_id: str = None  # Optional: explicitly pass case_id for demo sessions
    ) -> Dict[str, Any]:
        """
        Generate tutor response to student input using Socratic method.

        Args:
            session_id: Session UUID
            student_input: Student's question or response
            case_id: Optional case ID (used for demo sessions)

        Returns:
            Dictionary containing:
            - tutor_response: The Socratic response text
            - reasoning_metadata: Metadata about the reasoning process
        """
        # Check if this is a demo session (in-memory, no database)
        is_demo = str(session_id) == "00000000-0000-0000-0000-000000000000"

        if is_demo:
            # For demo sessions, load actual case data
            print(f"📌 DEMO SESSION DEBUG: case_id={case_id}, type={type(case_id)}")
            logger.info("📌 Demo session detected - loading demo case data")
            from app.data.demo_cases import get_demo_case

            try:
                # Get the demo case data (case_id should be like "case-1")
                # If case_id is not provided, default to case-1
                used_case_id = case_id or "case-1"
                print(f"📌 DEMO SESSION DEBUG: Loading case {used_case_id}")
                demo_case_data = get_demo_case(used_case_id)

                if not demo_case_data:
                    logger.warning(f"Demo case {case_id} not found, using generic fallback")
                    demo_case_data = {
                        "clinical_scenario": "Patient presenting with acute symptoms",
                        "chief_complaint": "Patient-reported chief complaint",
                        "differential_diagnoses": [],
                        "red_flags": [],
                    }

                case_context = {
                    "clinical_scenario": demo_case_data["clinical_scenario"],
                    "chief_complaint": demo_case_data["chief_complaint"],
                    "differential_diagnoses": demo_case_data.get("differential_diagnoses", []),
                    "red_flags": demo_case_data.get("red_flags", []),
                }

                print(f"✓ Case context prepared: {case_context['chief_complaint'][:50]}...")
                logger.info(f"Using demo case context: {case_context['chief_complaint'][:50]}...")

                # Use Kimi to analyze and respond with actual case context
                print(f"🔄 Calling K2 with case context...")
                result = await kimi_service.analyze_clinical_reasoning(
                    student_input=student_input,
                    case_context=case_context,
                    conversation_history=[]
                )
                print(f"✓ K2 response received")

                logger.info(f"Result type: {type(result)}, Result: {result}")

                if not isinstance(result, dict):
                    logger.error(f"Expected dict from kimi_service, got {type(result)}")
                    # Fallback for demo
                    return {
                        "tutor_response": "I understand. Can you tell me more about your symptoms?",
                        "reasoning_metadata": {}
                    }

                tutor_response = self._extract_patient_response(result.get("tutor_response", ""))
                return {
                    "tutor_response": tutor_response,
                    "reasoning_metadata": result.get("reasoning_metadata", {})
                }
            except Exception as e:
                logger.error(f"Error in demo session response generation: {str(e)}")
                print(f"❌ DEMO SESSION ERROR: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                # Fallback for demo
                return {
                    "tutor_response": "I'm listening. Can you describe what's happening?",
                    "reasoning_metadata": {}
                }

        # Load session and case context from database (real cases only)
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

        # Extract ONLY the patient response (filter out K2's thinking/analysis)
        tutor_response = self._extract_patient_response(result["tutor_response"])

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
            "tutor_response": tutor_response,
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
        session_id: UUID,
        case_id: str = None
    ) -> Dict[str, Any]:
        """
        Evaluate a student's overall performance in a session.

        Args:
            session_id: Session UUID
            case_id: Optional case ID (required for demo sessions)

        Returns:
            Evaluation with scores, feedback, and summary
        """
        # Check if this is a demo session
        is_demo_session = str(session_id) == "00000000-0000-0000-0000-000000000000"

        if is_demo_session:
            # For demo sessions, load case from demo_cases
            if not case_id:
                raise Exception("case_id required for demo session evaluation")

            from app.data.demo_cases import get_demo_case
            demo_case_data = get_demo_case(case_id)
            if not demo_case_data:
                raise Exception(f"Demo case {case_id} not found")

            # Create a mock case object from demo case data
            class MockCase:
                def __init__(self, data):
                    self.id = case_id
                    self.title = data.get("title")
                    self.chief_complaint = data.get("chief_complaint")
                    self.clinical_scenario = data.get("clinical_scenario")
                    self.differential_diagnoses = data.get("differential_diagnoses", [])
                    self.red_flags = data.get("red_flags", [])
                    self.learning_objectives = data.get("learning_objectives", [])

            case = MockCase(demo_case_data)

            # For demo sessions, interactions aren't stored in database
            # Return a basic evaluation without real interaction data
            print(f"📌 Evaluating demo session for {case_id}")
        else:
            # For real sessions, load from database
            session = await supabase_service.get_session(session_id)
            if not session:
                raise Exception("Session not found")

            case = await supabase_service.get_case(session.case_id)
            interactions = await supabase_service.get_session_history(session_id)

        # Get interactions - for demo sessions, this will be empty but evaluation still works
        if not is_demo_session:
            interactions = await supabase_service.get_session_history(session_id)
        else:
            interactions = []  # No interactions stored for demo sessions

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
        missed_red_flags = [flag for flag in (case.red_flags or []) if flag not in all_red_flags]

        # Analyze actual conversation for feedback
        strengths = []
        areas_for_improvement = []

        # Analyze student inputs for quality indicators
        student_inputs = [i.student_input.lower() for i in interactions if i.student_input]

        # Check for good practices
        asked_about_timeline = any("when" in q or "how long" in q or "started" in q for q in student_inputs)
        if asked_about_timeline:
            strengths.append("Asked about symptom timeline and duration")

        asked_about_severity = any("bad" in q or "severe" in q or "worse" in q or "worse" in q for q in student_inputs)
        if asked_about_severity:
            strengths.append("Assessed severity and progression of symptoms")

        asked_about_past = any("history" in q or "before" in q or "previously" in q for q in student_inputs)
        if asked_about_past:
            strengths.append("Explored relevant medical history")

        asked_about_meds = any("medication" in q or "taking" in q or "drug" in q for q in student_inputs)
        if asked_about_meds:
            strengths.append("Asked about current medications")

        asked_open_ended = any("?" in q and len(q.split()) < 4 for q in student_inputs)
        if asked_open_ended:
            strengths.append("Used effective questioning technique")

        if not strengths:
            strengths = ["Attempted systematic history gathering"]

        # Identify weaknesses from actual conversation
        if identified_red_flags < total_red_flags:
            missed_list = ", ".join(missed_red_flags[:2])
            areas_for_improvement.append(f"Missed critical red flags: {missed_list}")

        if not asked_about_timeline:
            areas_for_improvement.append("Didn't fully explore when symptoms started and how they've progressed")

        if not asked_about_severity:
            areas_for_improvement.append("Could have assessed symptom severity more thoroughly")

        if len(interactions) < 4:
            areas_for_improvement.append("Ask more follow-up questions to gather comprehensive history")

        if not all_diagnoses:
            areas_for_improvement.append("Didn't explicitly consider or mention differential diagnoses")

        if not areas_for_improvement:
            areas_for_improvement = ["Continue refining your clinical interview technique"]

        # Extract the correct diagnosis from the case
        sample_diagnosis = "Meningitis"  # Default
        if case and case.differential_diagnoses:
            diagnoses = case.differential_diagnoses
            if isinstance(diagnoses, dict):
                # Get the primary diagnosis (usually the first key-value pair)
                for key, value in diagnoses.items():
                    # Skip generic headers like "Must Rule Out", use actual diagnosis
                    if key.lower() not in ["must rule out", "always consider", "consider", "rule out"]:
                        if isinstance(value, dict):
                            # If value is a dict, try to get diagnosis name
                            sample_diagnosis = value.get("name", key).title()
                        else:
                            sample_diagnosis = str(value).strip().title()
                        break
            else:
                sample_diagnosis = str(diagnoses).strip().title()

        overall_assessment = f"You identified {identified_red_flags}/{total_red_flags} critical red flags. " \
                            f"The correct diagnosis is: {sample_diagnosis}. " \
                            f"Continue practicing systematic clinical reasoning."

        duration = self._calculate_duration(interactions)

        return {
            "evaluation": {
                "overall_assessment": overall_assessment,
                "strengths": strengths,
                "areas_for_improvement": areas_for_improvement,
                "key_findings": [f"Red flags identified: {identified_red_flags}/{total_red_flags}"],
                "missed_red_flags": missed_red_flags,
                "sample_diagnosis": sample_diagnosis,
                "full_differential_diagnoses": case.differential_diagnoses if case else {}
            },
            "summary": {
                "total_interactions": len(interactions),
                "duration_minutes": duration,
                "questions_asked": len(interactions),
                "red_flags_coverage": f"{identified_red_flags}/{total_red_flags}",
                "diagnoses_considered": list(all_diagnoses) if all_diagnoses else ["None documented"]
            }
        }
    
    def _calculate_duration(self, interactions: List[Any]) -> int:
        """Calculate session duration in minutes."""
        if not interactions or len(interactions) < 2:
            return 0

        start_time = interactions[0].timestamp
        end_time = interactions[-1].timestamp

        duration = (end_time - start_time).total_seconds() / 60
        return int(duration)

    def _extract_patient_response(self, response: str) -> str:
        """
        Extract ONLY patient dialogue from K2's response.
        Stop at ANY meta-commentary or analysis.
        """
        import re

        # Remove everything after <think> tags
        response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
        response = response.strip()

        # List of all patterns that indicate analysis/meta-commentary (stop here)
        stop_patterns = [
            r'\n\n',  # Double newline = likely new section
            r'(?:The (question|user|patient|doctor)|Analyzing|Based on|According to)',
            r'(?:This (seems|means|indicates)|That (means|suggests))',
            r'(?:As a patient|The patient (would|is|might))',
            r'(?:In response to|Response:|Draft:|Note:)',
            r'(?:\*\*|###|---)',  # Markdown markers
            r'(?:seems like|might be|could be)',
            r'(?:Clinical|Medical|Patient Information|Chief Complaint)',
        ]

        # Find where to cut off
        cutoff_pos = len(response)
        for pattern in stop_patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                cutoff_pos = min(cutoff_pos, match.start())

        # Take only valid patient dialogue
        patient_text = response[:cutoff_pos].strip()

        # If too long, take only first 4-6 sentences (allow more detailed patient responses)
        sentences = re.split(r'(?<=[.!?])\s+', patient_text)

        # Keep only first 6 meaningful sentences for more detailed responses
        result = []
        for sent in sentences[:6]:
            sent = sent.strip()
            if not sent or len(sent) < 3:
                continue
            # Skip if it's clearly not patient dialogue
            if any(marker in sent.lower() for marker in ['year-old', 'presents', 'chief complaint', 'differential']):
                continue
            result.append(sent)

        final_response = ' '.join(result).strip()

        # Ensure we have something
        if not final_response:
            final_response = "Um, I'm not sure..."

        return final_response


# Global reasoning engine instance
reasoning_engine = ReasoningEngine()
