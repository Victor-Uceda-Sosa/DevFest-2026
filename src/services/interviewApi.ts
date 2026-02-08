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
  sessionId: string,
  caseId?: string
): Promise<SessionCompleteResponse> => {
  const params = new URLSearchParams();
  if (caseId) {
    params.append('case_id', caseId);
  }

  const response = await api.post<SessionCompleteResponse>(
    `/api/sessions/${sessionId}/complete${params.toString() ? '?' + params.toString() : ''}`
  );
  return response.data;
};

// ===== Reasoning / Interaction API =====

export const sendTextInteraction = async (
  sessionId: string,
  textInput: string,
  caseId?: string
): Promise<InteractionResponse> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('text_input', textInput);
  if (caseId) {
    formData.append('case_id', caseId);
  }

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
  audioBlob: Blob,
  caseId?: string
): Promise<InteractionResponse> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('audio_file', audioBlob, 'recording.webm');
  if (caseId) {
    formData.append('case_id', caseId);
  }

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

// Streaming version of sendAudioInteraction - returns audio chunks as they're generated
export const sendAudioInteractionStream = async (
  sessionId: string,
  audioBlob: Blob,
  onChunk: (chunk: Uint8Array) => void,
  caseId?: string
): Promise<void> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('audio_file', audioBlob, 'recording.webm');
  if (caseId) {
    formData.append('case_id', caseId);
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${baseURL}/api/reasoning/interact-stream`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to stream audio: ${response.status}`);
  }

  // Stream the response body
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(value);
    }
  } finally {
    reader.releaseLock();
  }
};

// Streaming version of sendTextInteraction
export const sendTextInteractionStream = async (
  sessionId: string,
  textInput: string,
  onChunk: (chunk: Uint8Array) => void,
  caseId?: string
): Promise<void> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('text_input', textInput);
  if (caseId) {
    formData.append('case_id', caseId);
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${baseURL}/api/reasoning/interact-stream`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to stream audio: ${response.status}`);
  }

  // Stream the response body
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(value);
    }
  } finally {
    reader.releaseLock();
  }
};

// Combined function that handles both text and audio
export const sendInteraction = async (
  sessionId: string,
  input: { text?: string; audio?: Blob },
  caseId?: string
): Promise<InteractionResponse> => {
  if (input.audio) {
    return sendAudioInteraction(sessionId, input.audio, caseId);
  } else if (input.text) {
    return sendTextInteraction(sessionId, input.text, caseId);
  } else {
    throw new Error('Either text or audio input is required');
  }
};

// Combined streaming function
export const sendInteractionStream = async (
  sessionId: string,
  input: { text?: string; audio?: Blob },
  onChunk: (chunk: Uint8Array) => void,
  caseId?: string
): Promise<void> => {
  if (input.audio) {
    return sendAudioInteractionStream(sessionId, input.audio, onChunk, caseId);
  } else if (input.text) {
    return sendTextInteractionStream(sessionId, input.text, onChunk, caseId);
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
  sendTextInteractionStream,
  sendAudioInteractionStream,
  sendInteraction,
  sendInteractionStream,
};

export default interviewApi;
