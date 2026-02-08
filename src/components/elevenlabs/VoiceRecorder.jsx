import React, { useState, useRef } from 'react';

const VoiceRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimer(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleSubmit = () => {
    if (recordedAudio) {
      onRecordingComplete(recordedAudio, timer);
      setRecordedAudio(null);
      setTimer(0);
    }
  };

  const handleReset = () => {
    setRecordedAudio(null);
    setTimer(0);
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
            {isRecording ? 'Recording...' : recordedAudio ? 'Recording complete' : 'Ready to record'}
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center gap-4">
          {!isRecording && !recordedAudio && (
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <span>🎤</span> Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <span>⏹️</span> Stop Recording
            </button>
          )}

          {recordedAudio && (
            <>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
              >
                Re-record
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
              >
                <span>✓</span> Upload & Transcribe
              </button>
            </>
          )}
        </div>
      </div>

      {/* Audio Preview */}
      {recordedAudio && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <audio
            controls
            className="w-full"
            src={URL.createObjectURL(recordedAudio)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Duration: {formatTime(timer)}
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
