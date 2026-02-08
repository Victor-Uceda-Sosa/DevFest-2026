/**
 * Demo Medical Cases with Public Medical Images
 * Images sourced from:
 * - OpenI (openi.nlm.nih.gov) - NIH Medical Image Database
 * - Wikimedia Commons - Public medical images
 * - Licensed under Creative Commons
 */

import { CasePublic } from '../types/api';

export const demoCases: CasePublic[] = [
  {
    id: 'case-1',
    title: 'Acute Myocardial Infarction',
    chief_complaint: '45-year-old male with acute chest pain and dyspnea',
    learning_objectives: [
      'Recognize signs of acute MI',
      'Interpret EKG changes',
      'Assess troponin elevation',
      'Manage acute coronary syndrome',
    ],
  },
  {
    id: 'case-2',
    title: 'Pneumonia with Consolidation',
    chief_complaint: '68-year-old with fever, cough, and dyspnea x 5 days',
    learning_objectives: [
      'Identify pneumonia on imaging',
      'Assess severity of infection',
      'Determine causative organism',
      'Guide antibiotic selection',
    ],
  },
  {
    id: 'case-3',
    title: 'Acute Abdomen - Appendicitis',
    chief_complaint: '22-year-old with RLQ pain, fever, and vomiting',
    learning_objectives: [
      'Diagnose acute appendicitis',
      'Assess severity with imaging',
      'Evaluate for perforation',
      'Determine surgical urgency',
    ],
  },
  {
    id: 'case-4',
    title: 'Acute Stroke - Ischemic',
    chief_complaint: '58-year-old with acute onset right-sided weakness and aphasia',
    learning_objectives: [
      'Recognize acute stroke symptoms',
      'Interpret acute brain imaging',
      'Assess for thrombolytic eligibility',
      'Guide acute management',
    ],
  },
  {
    id: 'case-5',
    title: 'Diabetic Ketoacidosis',
    chief_complaint: '19-year-old with new-onset diabetes, polyuria, polydipsia, nausea',
    learning_objectives: [
      'Diagnose diabetic ketoacidosis',
      'Assess severity via labs',
      'Calculate anion gap',
      'Guide insulin and fluid management',
    ],
  },
];
