import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import VoiceRecorder from './VoiceRecorder.jsx';

const ConsultationInterface = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const transcriptEndRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Fetch available cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await api.get('/api/consultations/cases');
        setCases(response.data);
      } catch (error) {
        console.error('Failed to load cases');
      }
    };
    fetchCases();
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [transcript.length]);

  // Timer for call duration
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setCallDuration(elapsed);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const handleStartConsultation = async () => {
    if (!selectedCase) {
      console.warn('Please select a case');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/consultations/start', {
        case_id: selectedCase.case_id,
        case_title: selectedCase.case_title,
      });
      setConsultation(response.data);
      setTranscript([]);
      setCallDuration(0);
      setIsRecording(true);
      console.log('Consultation started!');
    } catch (error) {
      console.error('Failed to start consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptUpdate = (newText) => {
    // Add new transcript entry
    const entry = {
      timestamp: Date.now(),
      speaker: 'user',
      text: newText,
    };
    setTranscript((prev) => [...prev, entry]);
  };

  const handleInterviewStop = () => {
    setIsRecording(false);
  };

  const handleNewConsultation = () => {
    setSelectedCase(null);
    setConsultation(null);
    setTranscript([]);
    setCallDuration(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const caseTitle = selectedCase?.case_title || 'Patient Case';
  const caseDescription = selectedCase?.description || '';
  const difficulty = selectedCase?.difficulty || 'Medium';

  // Pre-Call Screen
  if (!consultation) {
    return (
      <div className="min-h-screen bg-slate-50">
        {!selectedCase ? (
          /* Case Selection */
          <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <div className="text-center mb-12">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-4">
                Doctor-Patient Interviews
              </h1>
              <p className="text-xl text-slate-600">
                Select a patient case to practice your consultation skills
              </p>
            </div>

            <div className="max-w-4xl w-full space-y-4">
              {cases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">Loading cases...</p>
                </div>
              ) : (
                cases.map((c) => (
                  <div
                    key={c.case_id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                      selectedCase?.case_id === c.case_id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900">
                          {c.case_title}
                        </h3>
                        <p className="text-slate-600 text-sm mt-2">{c.description}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 bg-slate-100 rounded-full text-slate-700 ml-4 whitespace-nowrap">
                        {c.difficulty}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedCase && (
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleStartConsultation}
                  disabled={loading}
                  className="px-12 py-4 bg-emerald-600 text-white text-lg font-bold rounded-2xl hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {loading ? 'Starting...' : 'Start Interview'}
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-12 py-4 bg-slate-100 text-slate-700 text-lg font-bold rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Pre-Call Ready Screen */
          <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <div className="text-center mb-12 max-w-2xl">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-4">Ready to Practice?</h1>
              <p className="text-xl text-slate-700 mb-2">
                Case: <span className="font-semibold">{caseTitle}</span>
              </p>
              <p className="text-lg text-slate-600">
                {difficulty} difficulty • Click below to start the interview
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-md w-full mb-8">
              <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for Success
              </h3>
              <ul className="text-slate-600 text-sm space-y-2">
                <li>• Listen actively to the patient's concerns</li>
                <li>• Ask clarifying questions</li>
                <li>• Take your time with each response</li>
                <li>• Show empathy and understanding</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStartConsultation}
                disabled={loading}
                className="px-12 py-4 bg-emerald-600 text-white text-lg font-bold rounded-2xl hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-3 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {loading ? 'Starting...' : 'Start Interview'}
              </button>
              <button
                onClick={() => setSelectedCase(null)}
                className="px-12 py-4 bg-slate-100 text-slate-700 text-lg font-bold rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
              >
                Back to Cases
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <div className="text-slate-600 text-sm">Interview with ElevenLabs</div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Transcript */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col" style={{ height: '75vh' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 font-semibold text-lg">Live Transcript</h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-sm font-medium">Listening</span>
              </div>
            </div>

            {/* Transcript Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {transcript.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Start speaking to see the transcript...</p>
                </div>
              ) : (
                <>
                  {transcript.map((msg, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="inline-block max-w-[80%] px-4 py-3 rounded-2xl bg-blue-600 text-white rounded-bl-sm">
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs mt-1 text-blue-200">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </>
              )}
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
                Recording in progress
              </div>
            </div>

            {/* Voice Recorder */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <VoiceRecorder
                onTranscriptUpdate={handleTranscriptUpdate}
                consultationId={consultation.id}
              />
            </div>

            {/* End Interview Button */}
            {isRecording && (
              <button
                onClick={handleInterviewStop}
                className="w-full px-4 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete Interview
              </button>
            )}

            {!isRecording && transcript.length > 0 && (
              <button
                onClick={handleNewConsultation}
                className="w-full px-4 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Start New Case
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationInterface;
