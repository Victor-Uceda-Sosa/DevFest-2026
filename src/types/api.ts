// API Type Definitions for K2 Backend

export interface ApiError {
  detail: string;
  status?: number;
}

// Case Models
export interface CasePublic {
  id: string;
  title: string;
  chief_complaint: string;
  learning_objectives: string[];
  created_at?: string;
}

export interface CaseCreate {
  title: string;
  chief_complaint: string;
  clinical_scenario: string;
  differential_diagnoses: string[];
  red_flags: string[];
  learning_objectives: string[];
}

// Session Models
export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export interface SessionCreate {
  case_id: string;
  student_id: string;
  metadata?: Record<string, any>;
}

export interface Session {
  id: string;
  case_id: string;
  student_id: string;
  status: SessionStatus;
  started_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface SessionStartResponse {
  session_id: string;
  case_id: string;
  status: string;
  started_at: string;
  initial_greeting: string;
  case_info: CasePublic;
}

export interface SessionCompleteResponse {
  session: Session;
  evaluation: {
    overall_assessment: string;
    strengths: string[];
    areas_for_improvement: string[];
    key_findings: string[];
    missed_red_flags: string[];
  };
  summary: {
    total_interactions: number;
    duration_minutes: number;
    questions_asked: number;
  };
}

// Interaction Models
export interface InteractionResponse {
  student_input: string;
  tutor_response: string;
  audio_url?: string | null;
  reasoning_metadata: Record<string, any>;
}

export interface Interaction {
  id: string;
  session_id: string;
  student_input: string;
  tutor_response: string;
  audio_url?: string | null;
  reasoning_metadata?: Record<string, any>;
  created_at: string;
}
