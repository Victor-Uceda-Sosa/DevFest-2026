import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import VoiceRecorder from './VoiceRecorder.jsx';

const ConsultationInterface = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const transcriptEndRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Fetch cases and start with random one
  useEffect(() => {
    const initializeConsultation = async () => {
      try {
        console.log('Fetching consultation cases...');
        const response = await api.get('/api/consultations/cases');
        console.log('Cases loaded:', response.data);
        setCases(response.data);

        // Pick random case
        if (response.data && response.data.length > 0) {
          const randomCase = response.data[Math.floor(Math.random() * response.data.length)];
          console.log('Selected random case:', randomCase);
          await startConsultation(randomCase);
        }
      } catch (error) {
        console.error('Failed to load cases', error);
        console.error('Error details:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeConsultation();
  }, []);

  const startConsultation = async (selectedCase) => {
    try {
      setLoading(true);
      console.log('Starting consultation with case:', selectedCase);
      const response = await api.post('/api/consultations/start', {
        case_id: selectedCase.case_id,
        case_title: selectedCase.case_title,
      });
      console.log('Consultation started successfully:', response.data);
      setConsultation(response.data);
      setTranscript([
        {
          timestamp: Date.now(),
          speaker: 'system',
          text: `Starting consultation with patient case: ${selectedCase.case_title}`,
        }
      ]);
      setCallDuration(0);

      // Simulate patient starting to speak (in real implementation, this comes from ElevenLabs)
      setTimeout(() => {
        addPatientMessage('Hello, I\'ve been experiencing some concerning symptoms lately and I\'m not sure what\'s causing them. I really appreciate you taking the time to speak with me today.');
        setIsRecording(true);
      }, 1000);

      // Start timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      setIsCalling(true);
    } catch (error) {
      console.error('Failed to start consultation', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addPatientMessage = (text) => {
    const entry = {
      timestamp: Date.now(),
      speaker: 'patient',
      text: text,
    };
    setTranscript((prev) => [...prev, entry]);
  };

  const addUserMessage = (text) => {
    const entry = {
      timestamp: Date.now(),
      speaker: 'user',
      text: text,
    };
    setTranscript((prev) => [...prev, entry]);
  };

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [transcript.length]);

  const handleTranscriptUpdate = (newText) => {
    // Add user's speech to transcript
    console.log('ConsultationInterface: Received transcript from VoiceRecorder:', newText);
    addUserMessage(newText);
  };

  const handleEndConsultation = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (!isCalling || !consultation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Failed to load consultation</p>
        </div>
      </div>
    );
  }

  const caseTitle = consultation?.case_title || 'Patient Consultation';

  // Active Call Screen
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Doctor-Patient Interview</h2>
            <p className="text-sm text-slate-600">{caseTitle}</p>
          </div>
          <div className="text-slate-600 text-sm">With ElevenLabs</div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Transcript */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col" style={{ height: '75vh' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 font-semibold text-lg">Live Transcript</h2>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                isRecording ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-sm font-medium">{isRecording ? 'Your Turn' : 'Listening'}</span>
              </div>
            </div>

            {/* Transcript Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {transcript.map((msg, idx) => {
                if (msg.speaker === 'system') {
                  return (
                    <div key={idx} className="text-center py-2">
                      <p className="text-xs text-slate-500 italic">{msg.text}</p>
                    </div>
                  );
                }

                const isUser = msg.speaker === 'user';
                return (
                  <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isUser ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      <svg className={`w-5 h-5 ${isUser ? 'text-blue-600' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isUser ? (
                          <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        )}
                      </svg>
                    </div>
                    <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
                      <div className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Right: Controls & Stats */}
          <div className="space-y-6">
            {/* Timer Card */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-sm">
              <div className="text-sm font-medium mb-2 opacity-90">Interview Duration</div>
              <div className="text-5xl font-bold mb-4">{formatTime(callDuration)}</div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                In progress
              </div>
            </div>

            {/* Voice Recorder */}
            {isRecording && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                <VoiceRecorder
                  onTranscriptUpdate={handleTranscriptUpdate}
                  consultationId={consultation?.id}
                />
              </div>
            )}

            {/* End Interview Button */}
            <button
              onClick={handleEndConsultation}
              className="w-full px-4 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              End Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationInterface;
