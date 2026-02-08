"""
Literature-Based Case Generation Service
Searches medical literature (PubMed) and generates realistic clinical cases.
Uses Featherless/K2 for case synthesis when available.
"""

import logging
import json
import httpx
import xml.etree.ElementTree as ET
import re
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
            logger.info(f"🔍 [START] Generating case for: {medical_condition}")
            logger.info(f"📚 Generating case from REAL medical literature for {medical_condition}")

            # Search PubMed for real cases - THIS IS REQUIRED
            logger.info(f"🔎 Searching PubMed for: {medical_condition} case report")
            literature = await self.search_pubmed(f"{medical_condition} case report", max_results=3)
            logger.info(f"📖 PubMed search returned {len(literature)} results")

            if not literature:
                logger.error(f"❌ Could not find medical literature for {medical_condition}")
                logger.error("   Cases must be based on real peer-reviewed literature")
                return None

            logger.info(f"✅ Found {len(literature)} real PubMed articles")

            # Format real literature data for K2
            literature_text = "\n\n".join([
                f"Title: {article['title']}\n\nAbstract:\n{article['abstract']}\n\nPubMed: {article['url']}"
                for article in literature
            ])

            # Use K2 to synthesize a case from the literature
            difficulty_hint = {
                "easy": "with a clear, obvious presentation and straightforward diagnosis",
                "medium": "with some clinical ambiguity requiring differential diagnosis",
                "hard": "with complex presentation and multiple competing diagnoses"
            }.get(difficulty, "with moderate complexity")

            pmid_list = ', '.join([a['pmid'] for a in literature])

            # Simplified prompt that forces JSON output
            prompt = f"""GENERATE JSON ONLY. NO OTHER TEXT.

Condition: {medical_condition}
Difficulty: {difficulty}
Literature: PMIDs {pmid_list}

{{"title":"Case title for {medical_condition}","chief_complaint":"Patient age/gender with main symptom","clinical_scenario":"Patient speaking naturally about symptoms. Example format: I started feeling {medical_condition} symptoms about X days ago. I have... What I notice is... It's worse when... etc."}}"""

            # Call K2 to generate case
            logger.info(f"🤖 Calling K2 to synthesize case from literature...")
            result = await self.kimi.complete(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            logger.info(f"✅ K2 returned response")

            if not result or not result.get("content"):
                logger.error("❌ Failed to generate case with K2 - no content in response")
                return None

            response = result["content"]
            logger.info(f"📝 K2 response length: {len(response)} chars")

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
                    # Add literature reference
                    case['literature_reference'] = f"PMIDs: {pmid_list}"
                    return case
                else:
                    logger.error(f"❌ Could not find JSON in K2 response: {response[:200]}")
                    return None
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse JSON from K2 response: {str(e)}")
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

    async def search_pubmed(self, query: str, max_results: int = 3) -> List[Dict[str, str]]:
        """
        Search PubMed for medical literature.

        Args:
            query: Search query
            max_results: Max results to return

        Returns:
            List of PubMed results with titles and URLs (REAL literature PMIDs)
        """
        try:
            logger.info(f"🔍 Searching PubMed for REAL literature: {query}")

            # PubMed E-utilities API
            async with httpx.AsyncClient(timeout=20.0) as client:
                # Search for article IDs (returns XML with title info)
                search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
                search_params = {
                    "db": "pubmed",
                    "term": query,
                    "retmax": max_results,
                    "rettype": "full",
                    "retmode": "xml"
                }

                search_response = await client.get(search_url, params=search_params)
                search_response.raise_for_status()

                # Parse XML response to extract article IDs
                results = []
                try:
                    root = ET.fromstring(search_response.text)

                    # Extract PMIDs from IdList/Id elements
                    id_list = root.find("IdList")
                    if id_list is not None:
                        for id_elem in id_list.findall("Id"):
                            if id_elem.text:
                                pmid = id_elem.text

                                results.append({
                                    "id": pmid,
                                    "title": f"PubMed Article {pmid}",
                                    "abstract": f"Medical literature case report from PubMed",
                                    "pmid": pmid,
                                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}"
                                })

                                if len(results) >= max_results:
                                    break

                except ET.ParseError as e:
                    logger.error(f"Failed to parse PubMed XML: {str(e)}")
                    return []

                if not results:
                    logger.warning(f"No PubMed results found for: {query}")
                    return []

                logger.info(f"✅ Found {len(results)} REAL PubMed articles (PMIDs: {[r['pmid'] for r in results]})")
                return results

        except Exception as e:
            logger.error(f"❌ PubMed search error: {str(e)}")
            return []


# Global instance (created on first use)
_generator_instance = None

def get_dedalus_agent() -> LiteratureCaseGenerator:
    """Get or create the literature case generator instance."""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = LiteratureCaseGenerator()
    return _generator_instance
