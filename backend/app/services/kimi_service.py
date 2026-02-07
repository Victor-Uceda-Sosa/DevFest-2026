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
        Analyze student's clinical reasoning and generate Socratic response.
        
        Args:
            student_input: Student's response or question
            case_context: Clinical case information
            conversation_history: Previous messages in the session
            
        Returns:
            Dictionary with tutor response and reasoning metadata
        """
        from app.utils.prompt_templates import format_system_prompt, format_interaction_prompt
        
        # Format prompts
        system_prompt = format_system_prompt(
            case_description=str(case_context.get("clinical_scenario", {})),
            chief_complaint=case_context.get("chief_complaint", "")
        )
        
        # Create conversation context
        history_text = self._format_history(conversation_history)
        
        user_message = format_interaction_prompt(
            student_input=student_input,
            conversation_history=history_text
        )
        
        # Query Kimi K2.5 via Featherless
        result = await self.query_k2_thinking(
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history[:-1] if len(conversation_history) > 0 else None,
            temperature=0.7
        )
        
        # Extract reasoning metadata
        reasoning_metadata = {
            "thinking_process": result.get("thinking_process", ""),
            "tokens_used": result.get("usage", {})
        }
        
        return {
            "tutor_response": result["response"],
            "reasoning_metadata": reasoning_metadata
        }
    
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
