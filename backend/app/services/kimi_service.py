"""
Kimi K2.5 service via Featherless AI for clinical reasoning.
"""
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings


class KimiService:
    """Service for Kimi K2.5 model via Featherless AI API."""
    
    def __init__(self):
        """Initialize Kimi service."""
        self.api_key = settings.featherless_api_key
        self.api_base = settings.featherless_api_base
        self.model = settings.featherless_model
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def query_k2_thinking(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """
        Query Kimi K2.5 model for clinical reasoning via Featherless.
        
        Args:
            system_prompt: System prompt with clinical context
            user_message: Current user message
            conversation_history: Previous conversation messages
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens in response
            
        Returns:
            Dictionary with response and metadata:
            {
                "response": "The tutor's response",
                "thinking_process": "Internal reasoning (if available)",
                "usage": {"prompt_tokens": 100, "completion_tokens": 50}
            }
            
        Raises:
            Exception: If API request fails
        """
        try:
            # Build full prompt from messages (Featherless uses completions format)
            prompt_parts = [f"System: {system_prompt}\n"]
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history:
                    role = msg.get("role", "user").capitalize()
                    content = msg.get("content", "")
                    prompt_parts.append(f"{role}: {content}\n")
            
            # Add current user message
            prompt_parts.append(f"User: {user_message}\n")
            prompt_parts.append("Assistant: ")
            
            full_prompt = "\n".join(prompt_parts)
            
            # Prepare request payload for Featherless completions endpoint
            payload = {
                "model": self.model,
                "prompt": full_prompt,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stop": ["\nUser:", "\nSystem:"]
            }
            
            # Make API request to completions endpoint
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.api_base}/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                
                result = response.json()
                
                # Extract response from completions format
                if "choices" not in result or len(result["choices"]) == 0:
                    raise Exception("No response choices in API result")
                
                choice = result["choices"][0]
                response_text = choice.get("text", "").strip()
                
                # Extract usage info
                usage = result.get("usage", {})
                
                return {
                    "response": response_text,
                    "thinking_process": "",  # Completions API doesn't return thinking
                    "usage": usage
                }
                
        except httpx.HTTPStatusError as e:
            print(f"Featherless API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Featherless API request failed: {e.response.status_code}")
        except httpx.RequestError as e:
            print(f"Featherless API request error: {str(e)}")
            raise Exception(f"Failed to connect to Featherless API: {str(e)}")
        except Exception as e:
            print(f"Kimi service error: {str(e)}")
            raise Exception(f"Kimi reasoning failed: {str(e)}")
    
    async def analyze_clinical_reasoning(
        self,
        student_input: str,
        case_context: Dict[str, Any],
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Analyze student's clinical reasoning and generate response.
        Switches between patient roleplay mode and evaluation mode based on input.
        
        Args:
            student_input: Student's response or question
            case_context: Clinical case information
            conversation_history: Previous messages in the session
            
        Returns:
            Dictionary with tutor response and reasoning metadata
        """
        from app.utils.prompt_templates import (
            format_patient_prompt,
            format_evaluation_prompt
        )
        
        # Detect if student is making a diagnosis
        diagnosis_keywords = [
            'i think you have', 
            'i believe you have', 
            'my diagnosis is',
            'you have',
            'it sounds like you have',
            'this could be',
            'you might have',
            'diagnosed with',
            'looks like'
        ]
        
        student_input_lower = student_input.lower()
        is_making_diagnosis = any(keyword in student_input_lower for keyword in diagnosis_keywords)
        
        print(f"   🔍 Diagnosis detection: {is_making_diagnosis}")
        
        if is_making_diagnosis:
            # EVALUATION MODE: Student is making a diagnosis
            print(f"   📊 Switching to EVALUATION mode")
            
            # Format conversation history
            history_text = self._format_history(conversation_history)
            
            # Get correct diagnosis from case context (or use first differential)
            correct_diagnosis = case_context.get("correct_diagnosis")
            if not correct_diagnosis:
                # Fallback: use first differential diagnosis as correct one
                diff_diag = case_context.get("differential_diagnoses", {})
                if isinstance(diff_diag, dict) and diff_diag:
                    correct_diagnosis = list(diff_diag.keys())[0]
                else:
                    correct_diagnosis = "unknown"
            
            system_prompt = format_evaluation_prompt(
                student_diagnosis=student_input,
                correct_diagnosis=correct_diagnosis,
                differential_diagnoses=case_context.get("differential_diagnoses", {}),
                red_flags=case_context.get("red_flags", []),
                conversation_history=history_text
            )
            
            # Use higher token limit for evaluation feedback
            result = await self.query_k2_thinking(
                system_prompt=system_prompt,
                user_message="Evaluate this diagnosis based on the conversation.",
                conversation_history=None,  # Already included in system prompt
                temperature=0.7,
                max_tokens=300  # More tokens for evaluation feedback
            )
            
            cleaned_text = result["response"].strip()
            
        else:
            # PATIENT MODE: Normal patient roleplay
            print(f"   👤 Using PATIENT mode")
            
            system_prompt = format_patient_prompt(
                case_description=str(case_context.get("clinical_scenario", {})),
                chief_complaint=case_context.get("chief_complaint", "")
            )
            
            # For patient mode, pass student's question directly
            user_message = student_input
            
            # Query Kimi K2.5 via Featherless
            result = await self.query_k2_thinking(
                system_prompt=system_prompt,
                user_message=user_message,
                conversation_history=conversation_history[:-1] if len(conversation_history) > 0 else None,
                temperature=0.8,
                max_tokens=150  # Shorter for concise patient responses
            )
            
            # Post-process response to remove any thinking text
            response_text = result["response"]
            cleaned_text = self._clean_thinking_text(response_text)
            
            # Fallback if cleaning failed
            if not cleaned_text or len(cleaned_text) < 10:
                print(f"   ⚠️  Response too short after cleaning, generating fallback")
                chief_complaint = case_context.get("chief_complaint", "not feeling well")
                cleaned_text = f"I've been having {chief_complaint.lower()}."
            
            # Verify no thinking keywords remain
            thinking_check = ['user is', 'i should', 'i need to', 'mention', 'case information', 'respond naturally']
            if any(keyword in cleaned_text.lower() for keyword in thinking_check):
                print(f"   ⚠️  Thinking keywords still present, using fallback")
                chief_complaint = case_context.get("chief_complaint", "not feeling well")
                cleaned_text = f"I've been having {chief_complaint.lower()}."
        
        # Extract reasoning metadata
        reasoning_metadata = {
            "thinking_process": result.get("thinking_process", ""),
            "tokens_used": result.get("usage", {}),
            "mode": "evaluation" if is_making_diagnosis else "patient"
        }
        
        return {
            "tutor_response": cleaned_text,
            "reasoning_metadata": reasoning_metadata
        }
    
    def _clean_thinking_text(self, text: str) -> str:
        """
        Remove any thinking text or meta-commentary that leaked into the response.
        Uses aggressive extraction to get ONLY patient dialogue.
        
        Args:
            text: Raw response from AI
            
        Returns:
            Cleaned response with only patient dialogue
        """
        import re
        
        original_text = text
        
        # Strategy 1: If there are quotes, extract the quoted text (likely the actual patient response)
        quote_pattern = r'["""](.*?)["""]'
        quotes = re.findall(quote_pattern, text, flags=re.DOTALL)
        if quotes:
            # Find the longest quote (likely the actual response, not example quotes)
            longest_quote = max(quotes, key=len) if quotes else ""
            if longest_quote and len(longest_quote) > 10:  # Reasonable patient response
                print(f"   🎯 Extracted quoted dialogue: {longest_quote[:100]}...")
                return longest_quote.strip()
        
        # Strategy 2: Remove ALL thinking patterns aggressively
        thinking_patterns = [
            # Meta-analysis
            r'The user is .*?(?:\.|$)',
            r'As the patient.*?(?:\.|$)',
            r'I need to.*?(?:\.|$)',
            r'I should.*?(?:\.|$)',
            r'From the case.*?(?:\.|$)',
            r'mention .*?(?:\.|$)',
            r'Keep it .*?(?:\.|$)',
            r'Response should.*?(?:\.|$)',
            r'This is just.*?(?:\.|$)',
            r'Actually.*?(?:\.|$)',
            r'But wait.*?(?:\.|$)',
            r'Looking at.*?(?:\.|$)',
            r'According to.*?(?:\.|$)',
            r'Given.*?(?:\.|$)',
            r'Better to.*?(?:\.|$)',
            r'Strictly following.*?(?:\.|$)',
            # Remove XML tags
            r'<think>.*?</think>',
            r'<[^>]+>',
            # Remove instructional phrases
            r'sound like.*?(?:\.|$)',
            r'be brief.*?(?:\.|$)',
            r'in character.*?(?:\.|$)',
            r'natural.*?(?:\.|$)',
        ]
        
        cleaned = text
        for pattern in thinking_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.DOTALL | re.IGNORECASE | re.MULTILINE)
        
        # Strategy 3: Look for sentences that start with "I" (patient speaking)
        # and don't contain meta-keywords
        sentences = [s.strip() for s in re.split(r'[.!?]', cleaned) if s.strip()]
        meta_keywords = ['user', 'mention', 'should', 'need to', 'case', 'information', 
                        'patient', 'respond', 'character', 'brief', 'natural']
        
        patient_sentences = []
        for sentence in sentences:
            sentence_lower = sentence.lower()
            # Keep sentences that don't have meta-keywords
            has_meta = any(keyword in sentence_lower for keyword in meta_keywords)
            if not has_meta and len(sentence) > 5:
                patient_sentences.append(sentence)
        
        if patient_sentences:
            result = '. '.join(patient_sentences)
            if result and len(result) > 10:
                print(f"   🎯 Extracted patient sentences: {result[:100]}...")
                return result.strip() + '.'
        
        # Strategy 4: If we still have text, try to extract anything after thinking
        # Look for patterns like "...[thinking]... 'Hey, I'm here because...'"
        if cleaned:
            # Split by newlines and take the last substantial line
            lines = [l.strip() for l in cleaned.split('\n') if l.strip()]
            if lines:
                last_line = lines[-1]
                if len(last_line) > 10 and not any(kw in last_line.lower() for kw in meta_keywords):
                    print(f"   🎯 Using last line as patient response: {last_line[:100]}...")
                    return last_line.strip()
        
        # Fallback: clean whitespace
        cleaned = re.sub(r'\n\s*\n', '\n', cleaned)
        cleaned = cleaned.strip()
        
        # If everything was removed, return a default response
        if not cleaned or len(cleaned) < 5:
            print(f"   ⚠️  All text was filtered out, using fallback response")
            return "I'm not feeling well."
        
        print(f"   ⚠️  Could not extract clean dialogue, returning cleaned version")
        return cleaned
    
    def _format_history(self, conversation_history: List[Dict[str, str]]) -> str:
        """Format conversation history for context."""
        if not conversation_history:
            return "This is the first interaction."
        
        formatted = []
        for msg in conversation_history[-10:]:  # Last 10 messages
            role = msg.get("role", "user")
            content = msg.get("content", "")
            formatted.append(f"{role.capitalize()}: {content}")
        
        return "\n".join(formatted)


# Global service instance
kimi_service = KimiService()
