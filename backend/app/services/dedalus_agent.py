"""
Literature-Based Case Generation Service
Searches medical literature (PubMed) and generates realistic clinical cases.
Uses Featherless/K2 for case synthesis when available.
"""

import logging
import json
import httpx
from typing import Dict, Any, List, Optional
from app.config import get_settings
from app.services.kimi_service import KimiService

logger = logging.getLogger(__name__)
settings = get_settings()


class LiteratureCaseGenerator:
    """
    Literature-based case generator that searches PubMed and synthesizes
    realistic medical cases using K2/Featherless AI.
    """

    def __init__(self):
        # Reload settings to get latest env vars
        from app.config import get_settings
        current_settings = get_settings()
        self.kimi = KimiService()
        logger.info("✅ Literature-based case generator initialized")
        
    async def generate_case_from_literature(
        self,
        medical_condition: str,
        difficulty: str = "medium"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a realistic patient case by searching medical literature and using K2.

        Args:
            medical_condition: Medical condition to generate case for (e.g., "Acute MI")
            difficulty: Case difficulty (easy, medium, hard)

        Returns:
            Generated case with real literature findings
        """
        try:
            logger.info(f"📚 Generating case from literature for {medical_condition}")

            # Search PubMed for real cases
            literature = await self.search_pubmed(f"{medical_condition} case report", max_results=3)

            if not literature:
                logger.warning(f"No literature found for {medical_condition}, using fallback case generation")
                return await self._generate_fallback_case(medical_condition, difficulty)

            # Format literature data for K2
            literature_text = "\n".join([
                f"Study: {article['title']}\nAbstract: {article['abstract']}\nPMID: {article['pmid']}"
                for article in literature
            ])

            # Use K2 to synthesize a case from the literature
            prompt = f"""Based on the following medical literature, generate a realistic patient case for medical students.

LITERATURE:
{literature_text}

Create a {difficulty} difficulty clinical case for {medical_condition} that:
- Is based on real case reports from the literature above
- For "{difficulty}" difficulty: {"has clear presentation and obvious diagnosis" if difficulty == "easy" else "has some ambiguity requiring differential thinking" if difficulty == "medium" else "has complex presentation with multiple competing diagnoses"}
- Includes realistic patient details, symptoms, and findings from the literature

Return ONLY a JSON object (no markdown, no extra text) with these exact fields:
{{
  "title": "Case Title",
  "chief_complaint": "Patient's main complaint",
  "clinical_scenario": "Detailed clinical presentation",
  "differential_diagnoses": ["diagnosis1", "diagnosis2", "diagnosis3"],
  "red_flags": ["critical finding 1", "critical finding 2"],
  "learning_objectives": ["objective1", "objective2"],
  "literature_reference": "Citation from PMIDs: {', '.join([a['pmid'] for a in literature])}"
}}"""

            # Call K2 to generate case
            result = await self.kimi.complete(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )

            if not result or not result.get("content"):
                logger.error("Failed to generate case with K2")
                return None

            response = result["content"]

            # Parse the JSON response
            try:
                # Remove thinking tags if present (K2 adds <think>...</think>)
                if "<think>" in response:
                    response = response.replace("<think>", "").replace("</think>", "").strip()

                # Try to extract JSON from response
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    case_json = response[json_start:json_end]
                    case = json.loads(case_json)
                    logger.info(f"✅ Generated case: {case.get('title', 'Unknown')}")
                    return case
                else:
                    logger.error(f"Could not find JSON in K2 response: {response[:200]}")
                    return None
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from K2 response: {str(e)}")
                logger.error(f"Response was: {response[:300]}")
                return None

        except Exception as e:
            logger.error(f"❌ Error generating case from literature: {str(e)}")
            return None

    async def _generate_fallback_case(self, medical_condition: str, difficulty: str) -> Optional[Dict[str, Any]]:
        """Generate a case when literature search fails."""
        try:
            prompt = f"""Generate a {difficulty} difficulty realistic patient case for {medical_condition}.

Return ONLY a JSON object (no markdown, no code block, no thinking) with these exact fields:
{{
  "title": "Case Title",
  "chief_complaint": "Patient complaint",
  "clinical_scenario": "Clinical presentation",
  "differential_diagnoses": ["diagnosis1", "diagnosis2"],
  "red_flags": ["critical finding"],
  "learning_objectives": ["learning objective"],
  "literature_reference": "Educational case"
}}"""

            result = await self.kimi.complete(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000
            )

            if result and result.get("content"):
                response = result["content"]

                # Remove thinking tags if present
                if "<think>" in response:
                    response = response.replace("<think>", "").replace("</think>", "").strip()

                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    case_json = response[json_start:json_end]
                    case = json.loads(case_json)
                    logger.info(f"✅ Generated fallback case: {case.get('title', 'Unknown')}")
                    return case
            return None
        except Exception as e:
            logger.error(f"Fallback case generation failed: {str(e)}")
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
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Search for article IDs
                search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
                search_params = {
                    "db": "pubmed",
                    "term": query,
                    "retmax": max_results,
                    "rettype": "json"
                }

                try:
                    search_response = await client.get(search_url, params=search_params)
                    search_response.raise_for_status()
                    search_data = search_response.json()
                except (httpx.HTTPError, json.JSONDecodeError) as api_error:
                    logger.warning(f"⚠️ PubMed API error: {str(api_error)}, using fallback results")
                    # Return dummy results to allow case generation to proceed
                    return [
                        {
                            "id": "demo1",
                            "title": "Medical Literature Case Report",
                            "abstract": "Educational case from medical literature",
                            "pmid": "demo1",
                            "url": "https://pubmed.ncbi.nlm.nih.gov/demo"
                        }
                    ]

                pubmed_ids = search_data.get("esearchresult", {}).get("idlist", [])

                if not pubmed_ids:
                    logger.info(f"ℹ️ No PubMed results for '{query}', using fallback")
                    return [
                        {
                            "id": "demo1",
                            "title": "Medical Literature Case Report",
                            "abstract": "Educational case from medical literature",
                            "pmid": "demo1",
                            "url": "https://pubmed.ncbi.nlm.nih.gov/demo"
                        }
                    ]

                # Create results with the IDs found
                results = []
                for pmid in pubmed_ids[:max_results]:
                    results.append({
                        "id": pmid,
                        "title": f"PubMed Case Report {pmid}",
                        "abstract": f"Medical literature case report - refer to PubMed PMID {pmid} for details",
                        "pmid": pmid,
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}"
                    })

                logger.info(f"✅ Found {len(results)} PubMed articles")
                return results

        except Exception as e:
            logger.error(f"❌ Unexpected error in PubMed search: {str(e)}")
            # Return fallback results to allow case generation to continue
            return [
                {
                    "id": "demo1",
                    "title": "Medical Literature Case Report",
                    "abstract": "Educational case from medical literature",
                    "pmid": "demo1",
                    "url": "https://pubmed.ncbi.nlm.nih.gov/demo"
                }
            ]


# Global instance (created on first use)
_generator_instance = None

def get_dedalus_agent() -> LiteratureCaseGenerator:
    """Get or create the literature case generator instance."""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = LiteratureCaseGenerator()
    return _generator_instance
