// TypeScript type definitions matching backend API models

export interface CasePublic {
  id: string;
  title: string;
  chief_complaint: string;
  learning_objectives: string[];
}

export interface Case extends CasePublic {
  clinical_scenario?: string;
  differential_diagnoses?: string[];
  red_flags?: string[];
  created_at?: string;
}

export interface SessionCreate {
  case_id: string;
  student_id: string;
  metadata?: Record<string, any>;
}

export interface SessionResponse {
  session_id: string;
  case_id: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  initial_greeting: string;
  case_info: CasePublic;
}

export interface Session {
  id: string;
  case_id: string;
  student_id: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface InteractionResponse {
  student_input: string;
  tutor_response: string;
  audio_url: string | null;
  reasoning_metadata: Record<string, any>;
}

export interface SessionCompleteResponse {
  session: Session;
  evaluation: {
    overall_assessment: string;
    strengths: string[];
    areas_for_improvement: string[];
    clinical_reasoning_score?: number;
    communication_score?: number;
    recommendations: string[];
  };
}

export interface Message {
  role: 'patient' | 'student';
  content: string;
  audio_url?: string | null;
  timestamp?: string;
}

export interface ApiError {
  detail: string;
}
