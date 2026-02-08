import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onTranscriptUpdate, consultationId }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create media recorder for continuous chunks
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Send audio chunks to server continuously
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await sendAudioChunk(event.data);
        }
      };

      // Request data every 500ms for real-time streaming
      mediaRecorder.start(500);
      setIsListening(true);
      setTimer(0);
      setTranscript('');

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const sendAudioChunk = async (audioBlob) => {
    if (!consultationId || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'chunk.webm');
      formData.append('consultation_id', consultationId);

      const response = await fetch('/api/consultations/stream-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transcript) {
          setTranscript((prev) => {
            // If this is a new transcription, append it
            // If it's an update to the same word, replace the last word
            return prev + ' ' + data.transcript;
          });

          // Notify parent component
          if (onTranscriptUpdate) {
            onTranscriptUpdate(data.transcript);
          }
        }
      }
    } catch (error) {
      console.error('Error sending audio chunk:', error);
    } finally {
      setIsSending(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      setIsListening(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-6">
        {/* Timer */}
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-blue-600">{formatTime(timer)}</p>
          <p className="text-gray-600 text-sm mt-1">
            {isListening ? '🎤 Listening (Real-time)...' : 'Ready to start interview'}
          </p>
        </div>

        {/* Listening Status */}
        {isListening && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-medium">Recording and transcribing live</span>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex justify-center gap-4">
          {!isListening && (
            <button
              onClick={startListening}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <span>🎤</span> Start Interview
            </button>
          )}

          {isListening && (
            <button
              onClick={stopListening}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <span>⏹️</span> Stop Interview
            </button>
          )}
        </div>
      </div>

      {/* Live Transcript */}
      {(isListening || transcript) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Live Transcript:</p>
          <div className="bg-white rounded p-3 min-h-20 max-h-40 overflow-y-auto">
            <p className="text-gray-800 whitespace-pre-wrap text-sm">
              {transcript || <span className="text-gray-400 italic">Listening...</span>}
            </p>
          </div>
          {isSending && (
            <p className="text-xs text-blue-600 mt-2">Sending audio...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
