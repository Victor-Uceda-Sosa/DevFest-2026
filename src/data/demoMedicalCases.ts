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
    medical_images: [
      {
        id: 'img-1-1',
        type: 'xray',
        url: 'https://images.pexels.com/photos/5214934/pexels-photo-5214934.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Chest X-ray - Frontal View',
        description: 'Baseline chest radiograph showing cardiac silhouette',
        findings: 'Normal cardiac size, clear lung fields',
      },
      {
        id: 'img-1-2',
        type: 'photo',
        url: 'https://images.pexels.com/photos/8376319/pexels-photo-8376319.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: '12-Lead EKG',
        description: 'Electrocardiogram showing acute ST changes',
        findings: 'ST elevation in leads II, III, aVF - Inferior MI',
      },
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
    medical_images: [
      {
        id: 'img-2-1',
        type: 'xray',
        url: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Chest X-ray - Pneumonia',
        description: 'Right upper lobe infiltrate consistent with pneumonia',
        findings: 'Dense consolidation RUL, air bronchograms present',
      },
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
    medical_images: [
      {
        id: 'img-3-1',
        type: 'ultrasound',
        url: 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Ultrasound - Abdomen',
        description: 'Transabdominal ultrasound of RLQ',
        findings: 'Dilated non-compressible appendix, 8mm diameter with appendicolith',
      },
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
    medical_images: [
      {
        id: 'img-4-1',
        type: 'ct',
        url: 'https://images.pexels.com/photos/3962283/pexels-photo-3962283.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'CT Head - Acute',
        description: 'Non-contrast CT showing early ischemic changes',
        findings: 'Hypodensity in left MCA distribution, no hemorrhage',
      },
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
    medical_images: [
      {
        id: 'img-5-1',
        type: 'lab',
        url: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Lab Results',
        description: 'Serum and capillary glucose',
        findings: 'Blood glucose: 542 mg/dL (severe hyperglycemia)',
      },
    ],
  },
];
