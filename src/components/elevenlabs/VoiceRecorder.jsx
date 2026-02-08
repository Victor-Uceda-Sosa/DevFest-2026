import React, { useState, useRef } from 'react';
import api from '../../services/api';

const VoiceRecorder = ({ onTranscriptUpdate, consultationId }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops, process the audio
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob) => {
    if (!consultationId) {
      console.error('No consultation ID');
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      console.log('Sending audio to backend...');
      const response = await api.post(
        `/api/consultations/${consultationId}/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Transcription response:', response.data);

      // Get transcript from response
      const transcript = response.data.transcript || response.data.text || '';
      if (transcript) {
        console.log('Adding transcript to chat:', transcript);
        onTranscriptUpdate(transcript);
      } else {
        console.warn('No transcript in response:', response.data);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
    } finally {
      setIsSending(false);
      audioChunksRef.current = [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-6">
        {/* Recording Status */}
        <div className="text-center mb-4">
          {isListening ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-medium">Recording...</span>
              </div>
              <p className="text-sm text-gray-600">Speak now and click Stop when done</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">Click Start to begin speaking</p>
            </>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center gap-4">
          {!isListening ? (
            <button
              onClick={startListening}
              disabled={isSending}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <span>🎤</span> Start Speaking
            </button>
          ) : (
            <button
              onClick={stopListening}
              disabled={isSending}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <span>⏹️</span> Stop & Process
            </button>
          )}
        </div>

        {isSending && (
          <div className="mt-4 text-center">
            <div className="inline-block">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-blue-600 mt-2">Processing your speech...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
