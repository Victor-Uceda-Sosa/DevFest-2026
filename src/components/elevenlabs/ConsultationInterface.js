import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import VoiceRecorder from './VoiceRecorder';
import { toast } from 'react-toastify';

const ConsultationInterface = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transcript, setTranscript] = useState(null);

  // Fetch available cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await api.get('/api/consultations/cases');
        setCases(response.data);
      } catch (error) {
        toast.error('Failed to load cases');
        console.error(error);
      }
    };
    fetchCases();
  }, []);

  const handleStartConsultation = async () => {
    if (!selectedCase) {
      toast.error('Please select a case');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/consultations/start', {
        case_id: selectedCase.case_id,
        case_title: selectedCase.case_title,
      });
      setConsultation(response.data);
      toast.success('Consultation started!');
    } catch (error) {
      toast.error('Failed to start consultation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob, duration) => {
    if (!consultation) {
      toast.error('No active consultation');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const response = await api.post(
        `/api/consultations/${consultation.id}/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Response:', response.data);
      const transcriptText = response.data.transcript || 'No transcript returned';
      console.log('Transcript:', transcriptText);
      setTranscript(transcriptText);
      setUploading(false);
      toast.success('Audio uploaded and transcribed!');
    } catch (error) {
      toast.error('Failed to upload audio');
      console.error(error);
      setUploading(false);
    }
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
      {consultation && !transcript && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {consultation.case_title}
            </h2>
            <p className="text-gray-600 mt-2">
              Click below to start recording your patient interview.
            </p>
          </div>

          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
          />

          {uploading && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-center">
                Uploading and transcribing audio...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transcript Display */}
      {transcript ? (
        <>
          {console.log('SHOWING TRANSCRIPT SECTION')}
          <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-600 p-4">
            <h3 className="text-lg font-semibold text-green-800">
              ✓ Transcription Complete
            </h3>
            <p className="text-green-700 text-sm mt-1">
              Your interview has been transcribed successfully.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Interview Transcript
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap text-sm">
                {transcript}
              </p>
            </div>
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
                // TODO: Generate feedback in next phase
                toast.info('Feedback generation coming soon!');
              }}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
            >
              Generate Feedback
            </button>
          </div>
        </div>
        </>
      ) : (
        console.log('TRANSCRIPT NOT SET')
      )}
    </div>
  );
};

export default ConsultationInterface;
