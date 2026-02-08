import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import VoiceRecorder from './VoiceRecorder.jsx';

const ConsultationInterface = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Fetch available cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await api.get('/api/consultations/cases');
        setCases(response.data);
      } catch (error) {
        console.error('Failed to load cases');
        console.error(error);
      }
    };
    fetchCases();
  }, []);

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
      console.log('Consultation started!');
    } catch (error) {
      console.error('Failed to start consultation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptUpdate = (newText) => {
    // Update transcript in real-time as it streams from ElevenLabs
    setTranscript((prev) => prev + ' ' + newText);
  };

  const handleInterviewComplete = () => {
    // Called when user stops the interview
    console.log('Interview complete with transcript:', transcript);
  };

  const handleNewConsultation = () => {
    setSelectedCase(null);
    setConsultation(null);
    setTranscript(null);
  };

  console.log('RENDER: consultation=', consultation, 'transcript=', transcript);

  return (
    <div className="space-y-6">
      {/* Case Selection */}
      {!consultation && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Select a Patient Case
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {cases.map((c) => (
              <div
                key={c.case_id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedCase?.case_id === c.case_id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                <h3 className="font-semibold text-lg text-gray-900">
                  {c.case_title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{c.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                    {c.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartConsultation}
            disabled={!selectedCase || loading}
            className="mt-6 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            {loading ? 'Starting...' : 'Start Consultation'}
          </button>
        </div>
      )}

      {/* Active Consultation */}
      {consultation && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {consultation.case_title}
            </h2>
            <p className="text-gray-600 mt-2">
              Click below to start your patient interview. Your speech will be transcribed in real-time.
            </p>
          </div>

          <VoiceRecorder
            onTranscriptUpdate={handleTranscriptUpdate}
            consultationId={consultation.id}
          />

          {transcript && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 border-l-4 border-green-600 p-4">
                <h3 className="text-lg font-semibold text-green-800">
                  ✓ Interview Transcript
                </h3>
                <p className="text-green-700 text-sm mt-1">
                  Real-time transcription of your interview
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-800 whitespace-pre-wrap text-sm">
                  {transcript}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleNewConsultation}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  New Consultation
                </button>
                <button
                  onClick={() => {
                    console.log('Feedback generation coming soon!');
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
                >
                  Generate Feedback
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsultationInterface;
