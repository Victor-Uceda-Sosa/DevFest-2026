"""
Simple in-memory medical knowledge base for case generation context.
Avoids ChromaDB complexity while still providing medical context to K2.
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


class MedicalKnowledgeBase:
    """
    In-memory medical knowledge base for informing case generation.
    K2 uses this context to generate medically accurate patient cases.
    """

    def __init__(self):
        """Initialize with common medical conditions."""
        self.knowledge = {
            "acute chest pain": {
                "symptoms": ["chest pain/discomfort", "shortness of breath", "diaphoresis", "nausea", "radiation to arm/jaw"],
                "differentials": ["Acute Coronary Syndrome", "Pulmonary Embolism", "Aortic Dissection", "Pneumothorax", "GERD", "Musculoskeletal pain"],
                "red_flags": ["ST elevation on EKG", "troponin elevation", "hypotension", "altered mental status", "severe uncontrolled pain"],
                "diagnostic_approach": "ECG within 10 minutes, troponin levels, chest X-ray, risk stratification with HEART score or TIMI",
                "treatment": "Aspirin, anticoagulation, beta-blockers, nitrates, revascularization if ACS confirmed"
            },
            "persistent cough": {
                "symptoms": ["dry cough", "productive cough with sputum", "cough > 3 weeks", "dyspnea", "chest pain with cough"],
                "differentials": ["Pneumonia", "Tuberculosis", "Lung Cancer", "GERD", "ACE inhibitor side effect", "Post-viral cough"],
                "red_flags": ["hemoptysis", "weight loss", "fever", "night sweats", "smoking history", "immunosuppression"],
                "diagnostic_approach": "Chest X-ray, sputum culture, TB testing if risk factors, CT if persistent despite treatment",
                "treatment": "Treat underlying cause, supportive care, cough suppressants, antibiotics if bacterial infection"
            },
            "abdominal pain": {
                "symptoms": ["abdominal discomfort/cramping", "nausea", "vomiting", "tenderness", "bloating"],
                "differentials": ["Appendicitis", "Cholecystitis", "Diverticulitis", "Peptic Ulcer Disease", "Pancreatitis", "Bowel obstruction"],
                "red_flags": ["severe pain", "rebound tenderness", "guarding", "hypotension", "rigid abdomen", "signs of peritonitis"],
                "diagnostic_approach": "Physical exam, CBC, metabolic panel, lipase, urinalysis, abdominal imaging (ultrasound or CT)",
                "treatment": "NPO status, IV fluids, electrolyte correction, antibiotics if infection, surgical intervention if indicated"
            },
            "dizziness and syncope": {
                "symptoms": ["vertigo", "presyncope", "loss of consciousness", "lightheadedness", "balance problems"],
                "differentials": ["Orthostatic Hypotension", "Arrhythmia", "Vasovagal Syncope", "Stroke/TIA", "Hypoglycemia", "Anemia"],
                "red_flags": ["chest pain", "palpitations", "focal neurologic deficits", "significant injury", "prolonged unconsciousness"],
                "diagnostic_approach": "Orthostatic vital signs, ECG, echocardiogram, Holter monitor, tilt table test if indicated",
                "treatment": "Address underlying cause, fall precautions, medication adjustment, pacemaker if arrhythmia, blood transfusion if anemia"
            },
            "fever and rash": {
                "symptoms": ["fever > 38°C", "generalized or localized rash", "pruritus", "malaise", "lymphadenopathy"],
                "differentials": ["Measles", "Chickenpox", "Meningococcemia", "Scarlet Fever", "Drug Reaction", "Mononucleosis"],
                "red_flags": ["meningeal signs (neck stiffness)", "petechial rash", "altered mental status", "hypotension", "respiratory distress"],
                "diagnostic_approach": "Viral serology, blood cultures if systemic, lumbar puncture if meningitis suspected, CBC with differential",
                "treatment": "Supportive care, antipyretics, antivirals if indicated, antibiotics if bacterial, isolation precautions"
            }
        }
        logger.info(f"✅ Medical knowledge base initialized with {len(self.knowledge)} conditions")

    def get_context_for_condition(self, condition: str) -> Dict[str, Any]:
        """
        Retrieve medical knowledge context for a condition.

        Args:
            condition: Medical condition name

        Returns:
            Medical knowledge dictionary or empty dict if not found
        """
        # Normalize condition name (lowercase, strip whitespace)
        normalized = condition.lower().strip()

        # Try exact match
        if normalized in self.knowledge:
            return self.knowledge[normalized]

        # Try partial match
        for key in self.knowledge.keys():
            if key in normalized or normalized in key:
                logger.info(f"Partial match: '{condition}' → '{key}'")
                return self.knowledge[key]

        logger.warning(f"No medical knowledge found for '{condition}'")
        return {}

    def format_context_for_prompt(self, condition: str) -> str:
        """
        Format medical knowledge into a text block for K2 prompt.

        Args:
            condition: Medical condition

        Returns:
            Formatted medical context string
        """
        context = self.get_context_for_condition(condition)

        if not context:
            return f"No specific medical knowledge available for '{condition}'. Generate based on clinical experience."

        return f"""
CONDITION: {condition}

SYMPTOMS TYPICALLY ASSOCIATED:
{chr(10).join([f"- {s}" for s in context.get('symptoms', [])])}

DIFFERENTIAL DIAGNOSES TO CONSIDER:
{chr(10).join([f"- {d}" for d in context.get('differentials', [])])}

RED FLAGS & CRITICAL FINDINGS:
{chr(10).join([f"- {f}" for f in context.get('red_flags', [])])}

DIAGNOSTIC APPROACH:
{context.get('diagnostic_approach', 'Standard evaluation')}

TREATMENT OVERVIEW:
{context.get('treatment', 'Standard management')}
"""


# Initialize knowledge base
medical_knowledge_base = MedicalKnowledgeBase()
