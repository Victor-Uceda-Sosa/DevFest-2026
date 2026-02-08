import api from './api_k2';
import {
  CasePublic,
  SessionCreate,
  SessionStartResponse,
  SessionCompleteResponse,
  InteractionResponse,
} from '../types/api';

/**
 * K2 Interview API Service
 * Handles all API calls to the K2 backend for clinical interviews
 */

// ===== Cases API =====

export const getCases = async (limit: number = 50): Promise<CasePublic[]> => {
  const response = await api.get<CasePublic[]>(`/api/cases`, {
    params: { limit },
  });
  return response.data;
};

export const getCase = async (caseId: string): Promise<CasePublic> => {
  const response = await api.get<CasePublic>(`/api/cases/${caseId}`);
  return response.data;
};

// ===== Sessions API =====

export const startSession = async (
  sessionData: SessionCreate
): Promise<SessionStartResponse> => {
  const response = await api.post<SessionStartResponse>(
    '/api/sessions/start',
    sessionData
  );
  return response.data;
};

export const getSession = async (sessionId: string): Promise<any> => {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
};

export const completeSession = async (
  sessionId: string
): Promise<SessionCompleteResponse> => {
  const response = await api.post<SessionCompleteResponse>(
    `/api/sessions/${sessionId}/complete`
  );
  return response.data;
};

// ===== Reasoning / Interaction API =====

export const sendTextInteraction = async (
  sessionId: string,
  textInput: string
): Promise<InteractionResponse> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('text_input', textInput);

  const response = await api.post<InteractionResponse>(
    '/api/reasoning/interact',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const sendAudioInteraction = async (
  sessionId: string,
  audioBlob: Blob
): Promise<InteractionResponse> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('audio_file', audioBlob, 'recording.webm');

  const response = await api.post<InteractionResponse>(
    '/api/reasoning/interact',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Combined function that handles both text and audio
export const sendInteraction = async (
  sessionId: string,
  input: { text?: string; audio?: Blob }
): Promise<InteractionResponse> => {
  if (input.audio) {
    return sendAudioInteraction(sessionId, input.audio);
  } else if (input.text) {
    return sendTextInteraction(sessionId, input.text);
  } else {
    throw new Error('Either text or audio input is required');
  }
};

// ===== Export all =====
export const interviewApi = {
  getCases,
  getCase,
  startSession,
  getSession,
  completeSession,
  sendTextInteraction,
  sendAudioInteraction,
  sendInteraction,
};

export default interviewApi;
