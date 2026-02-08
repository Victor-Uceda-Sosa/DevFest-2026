"""
Demo clinical cases for immediate practice without database.
These cases have full clinical context for dynamic AI patient responses.
"""

DEMO_CASES = {
    "case-1": {
        "title": "Acute Myocardial Infarction",
        "chief_complaint": "45-year-old male with acute chest pain and dyspnea",
        "clinical_scenario": "A 45-year-old male with history of hypertension and smoking presents to the ED with sudden onset chest pain that started 2 hours ago. He describes the pain as substernal, pressure-like, radiating to his left arm and jaw. Associated with shortness of breath, diaphoresis, and nausea. He took an aspirin at home. Vitals: BP 165/95, HR 105, RR 22, O2 sat 94% on room air.",
        "differential_diagnoses": [
            "Acute Myocardial Infarction (STEMI vs NSTEMI)",
            "Unstable Angina",
            "Aortic Dissection",
            "Pulmonary Embolism",
            "Pericarditis",
            "Costochondritis"
        ],
        "red_flags": [
            "Chest pain with radiation to left arm",
            "Diaphoresis",
            "Shortness of breath",
            "Elevated blood pressure",
            "Tachycardia"
        ],
        "learning_objectives": [
            "Recognize signs of acute MI",
            "Interpret EKG changes",
            "Assess troponin elevation",
            "Manage acute coronary syndrome"
        ]
    },
    "case-2": {
        "title": "Pneumonia with Consolidation",
        "chief_complaint": "68-year-old with fever, cough, and dyspnea x 5 days",
        "clinical_scenario": "A 68-year-old female with COPD and diabetes presents with 5-day history of productive cough with green sputum, fever to 102.5F, and progressive shortness of breath. She reports chills and malaise. Smokes 2 PPD. Lives alone. Denies chest pain. Vitals: BP 145/88, HR 98, RR 24, O2 sat 88% on room air. Lungs: crackles in right lower lobe, decreased breath sounds.",
        "differential_diagnoses": [
            "Bacterial Pneumonia (Streptococcus pneumoniae, Haemophilus influenzae)",
            "Viral Pneumonia",
            "Atypical Pneumonia (Legionella, Mycoplasma)",
            "COPD exacerbation",
            "Bronchitis",
            "Aspiration pneumonia"
        ],
        "red_flags": [
            "Fever",
            "Productive cough",
            "Hypoxia",
            "Tachypnea",
            "Crackles on exam",
            "Age >65 with comorbidities"
        ],
        "learning_objectives": [
            "Identify pneumonia on imaging",
            "Assess severity of infection",
            "Determine causative organism",
            "Guide antibiotic selection"
        ]
    },
    "case-3": {
        "title": "Acute Abdomen - Appendicitis",
        "chief_complaint": "22-year-old with RLQ pain, fever, and vomiting",
        "clinical_scenario": "A 22-year-old female presents with 18 hours of right lower quadrant pain, fever to 101.3F, and two episodes of vomiting. Pain started periumbilically and migrated to RLQ (classic McBurney's point). Last menstrual period was 1 week ago. Denies vaginal bleeding or discharge. Denies urinary symptoms. Vitals: BP 128/82, HR 92, RR 18, Temp 101.3F. Abdomen: right lower quadrant tenderness, guarding, positive Rovsing's sign.",
        "differential_diagnoses": [
            "Acute Appendicitis",
            "Ectopic pregnancy",
            "Ovarian torsion",
            "Pelvic inflammatory disease",
            "Mesenteric lymphadenitis",
            "Irritable bowel syndrome",
            "Diverticulitis",
            "Nephrolithiasis"
        ],
        "red_flags": [
            "RLQ pain with migration from periumbilical",
            "Fever",
            "Guarding and rebound tenderness",
            "Positive Rovsing's sign",
            "Vomiting",
            "Tachycardia"
        ],
        "learning_objectives": [
            "Diagnose acute appendicitis",
            "Assess severity with imaging",
            "Evaluate for perforation",
            "Determine surgical urgency"
        ]
    },
    "case-4": {
        "title": "Acute Stroke - Ischemic",
        "chief_complaint": "58-year-old with acute onset right-sided weakness and aphasia",
        "clinical_scenario": "A 58-year-old male with hypertension, diabetes, and atrial fibrillation (not on anticoagulation) woke up 45 minutes ago with acute onset right-sided weakness and difficulty speaking. Wife called EMS immediately. Last known normal was 45 minutes ago. Vitals: BP 168/95, HR 82 (irregular), RR 16. Neuro: Alert, expressive aphasia, right facial droop, right arm weakness (3/5), right leg weakness (4/5), normal sensation, no neglect.",
        "differential_diagnoses": [
            "Acute Ischemic Stroke (anterior circulation)",
            "Hemorrhagic Stroke",
            "Transient Ischemic Attack",
            "Todd's paralysis (post-ictal)",
            "Complex migraine",
            "Hypoglycemia",
            "Brain tumor",
            "Subdural hematoma"
        ],
        "red_flags": [
            "Acute onset focal neurologic deficit",
            "Facial droop",
            "Arm weakness",
            "Speech difficulty",
            "Time-sensitive (thrombolytic window)",
            "Irregular heart rate (AFib)"
        ],
        "learning_objectives": [
            "Recognize acute stroke symptoms",
            "Interpret acute brain imaging",
            "Assess for thrombolytic eligibility",
            "Guide acute management"
        ]
    },
    "case-5": {
        "title": "Diabetic Ketoacidosis",
        "chief_complaint": "19-year-old with new-onset diabetes, polyuria, polydipsia, nausea",
        "clinical_scenario": "A 19-year-old male with no significant past medical history presents with 1-week history of polyuria, polydipsia, weight loss of 5 lbs, and 2 days of nausea, vomiting, and malaise. Reports rapid breathing. No recent illness. Drinks ~4L of soda daily. Vitals: BP 110/70, HR 110, RR 28 (deep), Temp 37.2C. General: appears ill, Kussmaul respirations, fruity breath odor. Labs pending.",
        "differential_diagnoses": [
            "Diabetic Ketoacidosis",
            "Type 1 Diabetes Mellitus (new onset)",
            "Type 2 Diabetes Mellitus",
            "Acute gastroenteritis",
            "Pneumonia",
            "Urinary tract infection",
            "Appendicitis",
            "Hyperglycemic hyperosmolar state"
        ],
        "red_flags": [
            "Polyuria and polydipsia",
            "Kussmaul respirations",
            "Fruity breath odor",
            "Tachycardia",
            "Tachypnea",
            "Nausea and vomiting",
            "Altered mental status possible"
        ],
        "learning_objectives": [
            "Diagnose diabetic ketoacidosis",
            "Assess severity via labs",
            "Calculate anion gap",
            "Guide insulin and fluid management"
        ]
    }
}


def get_demo_case(case_id: str) -> dict:
    """
    Get a demo case by ID.

    Args:
        case_id: Demo case ID (e.g., "case-1")

    Returns:
        Case data dictionary or None if not found
    """
    return DEMO_CASES.get(case_id)
