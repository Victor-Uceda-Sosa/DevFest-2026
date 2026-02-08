"""
ChromaDB service for storing and retrieving medical knowledge.
Used to inform case generation with evidence-based medical information.
"""

import logging
from typing import List, Dict, Any, Optional
import chromadb

logger = logging.getLogger(__name__)


class ChromaService:
    """
    Manages medical knowledge embeddings in ChromaDB.
    Stores medical textbooks, guidelines, and case studies for retrieval.
    """

    def __init__(self):
        """
        Initialize ChromaDB client with in-memory storage.
        """
        try:
            # Initialize ChromaDB client with in-memory storage (simpler, more reliable)
            self.client = chromadb.Client()
            logger.info("✅ ChromaDB initialized (in-memory)")
        except Exception as e:
            logger.error(f"❌ Failed to initialize ChromaDB: {e}")
            self.client = None

        # Collection for medical conditions
        self.medical_collection = None
        if self.client:
            try:
                self.medical_collection = self.client.get_or_create_collection(
                    name="medical_knowledge",
                    metadata={"description": "Medical conditions, symptoms, diagnoses, treatments"}
                )
                logger.info("✅ Medical knowledge collection created/retrieved")
            except Exception as e:
                logger.error(f"Failed to create medical collection: {e}")
                self.client = None

    async def add_medical_knowledge(
        self,
        condition: str,
        symptoms: List[str],
        differentials: List[str],
        red_flags: List[str],
        diagnostic_approach: str,
        treatment_overview: str,
        evidence_level: str = "High"
    ) -> str:
        """
        Add medical knowledge about a condition to ChromaDB.

        Args:
            condition: Medical condition name
            symptoms: List of associated symptoms
            differentials: List of differential diagnoses
            red_flags: Critical warning signs
            diagnostic_approach: How to diagnose
            treatment_overview: Treatment options
            evidence_level: Quality of evidence

        Returns:
            Document ID in ChromaDB
        """
        if not self.medical_collection:
            logger.error("Medical collection not available")
            return None

        try:
            # Create comprehensive document
            document = f"""
CONDITION: {condition}

SYMPTOMS:
{chr(10).join([f"- {s}" for s in symptoms])}

DIFFERENTIAL DIAGNOSES:
{chr(10).join([f"- {d}" for d in differentials])}

RED FLAGS (Critical Warning Signs):
{chr(10).join([f"- {f}" for f in red_flags])}

DIAGNOSTIC APPROACH:
{diagnostic_approach}

TREATMENT OVERVIEW:
{treatment_overview}

EVIDENCE LEVEL: {evidence_level}
"""

            doc_id = f"condition_{condition.lower().replace(' ', '_')}"

            # Add to collection
            self.medical_collection.add(
                ids=[doc_id],
                documents=[document],
                metadatas=[{
                    "condition": condition,
                    "evidence_level": evidence_level,
                    "symptom_count": len(symptoms)
                }]
            )

            logger.info(f"✅ Added medical knowledge for {condition}")
            return doc_id

        except Exception as e:
            logger.error(f"Error adding medical knowledge: {e}")
            return None

    async def retrieve_medical_context(
        self,
        query: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant medical knowledge for a condition/symptom.

        Args:
            query: Medical condition or symptom to search for
            top_k: Number of results to return

        Returns:
            List of relevant medical knowledge documents
        """
        if not self.medical_collection:
            logger.warning("Medical collection not available")
            return []

        try:
            results = self.medical_collection.query(
                query_texts=[query],
                n_results=top_k
            )

            if not results or not results.get("documents"):
                logger.warning(f"No medical knowledge found for: {query}")
                return []

            # Format results
            retrieved = []
            for i, doc in enumerate(results.get("documents", [[]])[0]):
                retrieved.append({
                    "content": doc,
                    "metadata": results.get("metadatas", [[]])[0][i] if results.get("metadatas") else {},
                    "relevance": 1.0 - (i * 0.2)  # Simple relevance scoring
                })

            logger.info(f"✅ Retrieved {len(retrieved)} medical documents for: {query}")
            return retrieved

        except Exception as e:
            logger.error(f"Error retrieving medical context: {e}")
            return []

    async def seed_common_conditions(self):
        """
        Seed ChromaDB with common medical conditions.
        Only runs if collection is empty.
        """
        if not self.medical_collection:
            return

        try:
            # Check if already seeded
            count = self.medical_collection.count()
            if count > 0:
                logger.info(f"✅ ChromaDB already seeded with {count} conditions")
                return

            logger.info("🌱 Seeding ChromaDB with common conditions...")

            conditions = [
                {
                    "condition": "Acute Chest Pain",
                    "symptoms": ["chest discomfort", "pain radiating to arm", "shortness of breath", "diaphoresis"],
                    "differentials": ["Acute Coronary Syndrome", "Pulmonary Embolism", "Aortic Dissection", "Pneumothorax"],
                    "red_flags": ["ST elevation on EKG", "troponin elevation", "hypotension", "altered mental status"],
                    "diagnostic_approach": "ECG within 10 minutes, troponin levels, chest X-ray, risk stratification with HEART score",
                    "treatment_overview": "Aspirin, anticoagulation, revascularization if ACS confirmed, supportive care"
                },
                {
                    "condition": "Persistent Cough",
                    "symptoms": ["dry cough", "productive cough", "cough > 3 weeks", "dyspnea"],
                    "differentials": ["Pneumonia", "Tuberculosis", "Lung Cancer", "GERD", "ACE inhibitor side effect"],
                    "red_flags": ["hemoptysis", "weight loss", "fever", "night sweats", "smoking history"],
                    "diagnostic_approach": "Chest X-ray, sputum culture, TB testing if risk factors, consider CT if persistent",
                    "treatment_overview": "Treat underlying cause, supportive care, cough suppressants as needed"
                },
                {
                    "condition": "Acute Abdominal Pain",
                    "symptoms": ["abdominal discomfort", "nausea", "vomiting", "tenderness"],
                    "differentials": ["Appendicitis", "Cholecystitis", "Diverticulitis", "Peptic Ulcer Disease", "Pancreatitis"],
                    "red_flags": ["severe pain", "rebound tenderness", "hypotension", "rigid abdomen"],
                    "diagnostic_approach": "Physical exam, CBC, metabolic panel, lipase, abdominal imaging (ultrasound or CT)",
                    "treatment_overview": "NPO status, IV fluids, antibiotics if infection, surgical consultation if indicated"
                },
                {
                    "condition": "Dizziness and Syncope",
                    "symptoms": ["vertigo", "presyncope", "loss of consciousness", "lightheadedness"],
                    "differentials": ["Orthostatic Hypotension", "Arrhythmia", "Vasovagal Syncope", "Stroke", "Hypoglycemia"],
                    "red_flags": ["chest pain", "palpitations", "focal neurologic deficits", "significant injury"],
                    "diagnostic_approach": "Orthostatic vital signs, ECG, echocardiogram, Holter monitor if arrhythmia suspected",
                    "treatment_overview": "Address underlying cause, fall precautions, medication adjustment, pacemaker if indicated"
                },
                {
                    "condition": "Fever and Rash",
                    "symptoms": ["fever > 38°C", "generalized rash", "pruritus", "malaise"],
                    "differentials": ["Measles", "Chickenpox", "Meningococcemia", "Scarlet Fever", "Drug Reaction"],
                    "red_flags": ["meningeal signs", "petechial rash", "altered mental status", "hypotension"],
                    "diagnostic_approach": "Viral serology, blood cultures if systemic infection, lumbar puncture if meningitis suspected",
                    "treatment_overview": "Supportive care, antipyretics, antibiotics if bacterial, isolation precautions"
                }
            ]

            for cond in conditions:
                await self.add_medical_knowledge(**cond)

            logger.info(f"✅ Seeded {len(conditions)} medical conditions")

        except Exception as e:
            logger.error(f"Error seeding conditions: {e}")


# Initialize service
chroma_service = ChromaService()
