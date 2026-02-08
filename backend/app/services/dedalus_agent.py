"""
Dedalus Agent Service for Literature-Based Case Generation
Uses Dedalus to search medical literature and generate realistic clinical cases.
"""

import logging
import json
import httpx
from typing import Dict, Any, List, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class DedalusAgent:
    """
    Dedalus-powered agent for generating realistic medical cases from literature.
    Uses tool calling to search PubMed and retrieve medical knowledge.
    """

    def __init__(self):
        # Reload settings to get latest env vars
        from app.config import get_settings
        current_settings = get_settings()
        self.api_key = current_settings.dedalus_api_key
        self.api_base = "https://api.dedaluslabs.ai/v1"
        self.model = "gpt-4-turbo"  # Dedalus supports multiple models

        logger.info(f"🔑 Dedalus API Key loaded: {bool(self.api_key)}")
        if not self.api_key or self.api_key == "":
            logger.warning("⚠️  Dedalus API key not configured. Literature search will not work.")
            logger.warning(f"   Current value: '{self.api_key}'")
        
    async def generate_case_from_literature(
        self,
        medical_condition: str,
        difficulty: str = "medium"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a realistic patient case by searching medical literature.

        Args:
            medical_condition: Medical condition to generate case for (e.g., "Acute MI")
            difficulty: Case difficulty (easy, medium, hard)

        Returns:
            Generated case with real literature findings
        """
        try:
            if not self.api_key or self.api_key == "":
                logger.error("❌ Dedalus API key not configured")
                return None

            logger.info(f"🔍 Dedalus: Generating case from literature for {medical_condition}")
            
            # Define tools for Dedalus agent
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "search_pubmed",
                        "description": "Search PubMed for medical literature and case reports",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Search query for PubMed (e.g., 'acute myocardial infarction case report')"
                                },
                                "max_results": {
                                    "type": "integer",
                                    "description": "Maximum number of results to return",
                                    "default": 5
                                }
                            },
                            "required": ["query"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "extract_case_details",
                        "description": "Extract clinical case details from literature",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "literature_data": {
                                    "type": "string",
                                    "description": "Raw literature data to extract case details from"
                                }
                            },
                            "required": ["literature_data"]
                        }
                    }
                }
            ]
            
            # System prompt for Dedalus agent
            system_prompt = f"""You are a medical education AI agent. Your task is to generate a realistic patient case for medical students to practice clinical reasoning.

The case should be based on REAL medical literature and case reports. Follow these steps:
1. Search PubMed for real case reports of {medical_condition}
2. Extract realistic clinical details (presentation, findings, diagnosis)
3. Create a detailed, medically accurate case for the student to interview

The difficulty should be {difficulty}:
- easy: Clear presentation, obvious diagnosis
- medium: Some ambiguity, requires differential thinking
- hard: Complex presentation, multiple competing diagnoses

Generate the case in JSON format with these fields:
- title: Case title
- chief_complaint: Patient's main complaint
- clinical_scenario: Detailed clinical presentation
- differential_diagnoses: List of likely diagnoses
- red_flags: Critical findings not to miss
- learning_objectives: What the student should learn
- literature_reference: Citation from the literature used

Use the tools to search for real cases and extract realistic information."""

            # Make request to Dedalus API
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Content-Type": "application/json"
                }
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"

                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers=headers,
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": system_prompt
                            },
                            {
                                "role": "user",
                                "content": f"Generate a {difficulty} difficulty clinical case for {medical_condition} based on real medical literature."
                            }
                        ],
                        "tools": tools,
                        "tool_choice": "auto",
                        "temperature": 0.7,
                        "max_tokens": 2000
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Dedalus API error: {response.status_code} - {response.text}")
                    return None
                    
                result = response.json()
                logger.info(f"✅ Dedalus response received")
                
                # Extract case from response
                if "choices" in result and result["choices"]:
                    message = result["choices"][0]["message"]
                    
                    # If tool was called, handle tool response
                    if "tool_calls" in message:
                        logger.info(f"🔧 Dedalus made {len(message['tool_calls'])} tool call(s)")
                        # In production, would handle tool responses and call again
                    
                    # Extract content
                    content = message.get("content", "")
                    
                    # Parse JSON from response
                    try:
                        # Try to extract JSON from content
                        json_start = content.find('{')
                        json_end = content.rfind('}') + 1
                        if json_start >= 0 and json_end > json_start:
                            case_json = content[json_start:json_end]
                            case = json.loads(case_json)
                            logger.info(f"✅ Generated case: {case.get('title', 'Unknown')}")
                            return case
                    except json.JSONDecodeError:
                        logger.warning("Could not parse JSON from Dedalus response")
                        
                return None
                
        except Exception as e:
            logger.error(f"❌ Error in Dedalus case generation: {str(e)}")
            return None

    async def search_pubmed(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        Search PubMed for medical literature.
        
        Args:
            query: Search query
            max_results: Max results to return
            
        Returns:
            List of PubMed results with titles, abstracts, URLs
        """
        try:
            logger.info(f"🔍 Searching PubMed for: {query}")
            
            # PubMed E-utilities API
            async with httpx.AsyncClient() as client:
                # First, search for article IDs
                search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
                search_params = {
                    "db": "pubmed",
                    "term": query,
                    "retmax": max_results,
                    "rettype": "json"
                }
                
                search_response = await client.get(search_url, params=search_params)
                search_data = search_response.json()
                
                pubmed_ids = search_data.get("esearchresult", {}).get("idlist", [])
                
                if not pubmed_ids:
                    logger.warning(f"No PubMed results for: {query}")
                    return []
                
                # Fetch details for each ID
                fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
                fetch_params = {
                    "db": "pubmed",
                    "id": ",".join(pubmed_ids),
                    "rettype": "abstract",
                    "retmode": "json"
                }
                
                fetch_response = await client.get(fetch_url, params=fetch_params)
                fetch_data = fetch_response.json()
                
                results = []
                articles = fetch_data.get("result", {}).get("uids", [])
                
                for uid in articles[:max_results]:
                    article = fetch_data.get("result", {}).get(uid, {})
                    results.append({
                        "id": uid,
                        "title": article.get("title", ""),
                        "abstract": article.get("abstract", ""),
                        "pmid": uid,
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{uid}"
                    })
                
                logger.info(f"✅ Found {len(results)} PubMed articles")
                return results
                
        except Exception as e:
            logger.error(f"❌ PubMed search error: {str(e)}")
            return []


# Global instance (created on first use)
dedalus_agent = None

def get_dedalus_agent() -> DedalusAgent:
    """Get or create the Dedalus agent instance."""
    global dedalus_agent
    if dedalus_agent is None:
        dedalus_agent = DedalusAgent()
    return dedalus_agent
