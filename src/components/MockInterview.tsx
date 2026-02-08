import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { User, Bot, Play, RotateCcw, CheckCircle2, AlertCircle, Sparkles, Square, Loader2, Mic, Send } from 'lucide-react';
import { Badge } from './ui/badge';
import { AudioRecorder, formatRecordingTime } from '../utils/audioRecorder';
import interviewApi from '../services/interviewApi';
import { CasePublic, SessionStartResponse, SessionCompleteResponse } from '../types/api';

interface Message {
  role: 'patient' | 'student';
  content: string;
  audioUrl?: string | null;
}

export function MockInterview() {
  // State management
  const [cases, setCases] = useState<CasePublic[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CasePublic | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  // Voice recording state
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Feedback state
  const [feedback, setFeedback] = useState<SessionCompleteResponse | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load cases on component mount
  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      setError(null);
      const fetchedCases = await interviewApi.getCases();
      setCases(fetchedCases);
    } catch (err: any) {
      console.error('Error loading cases:', err);
      setError(err.message || 'Failed to load clinical cases. Please refresh the page.');
    } finally {
      setLoadingCases(false);
    }
  };

  // Start a new interview session
  const startInterview = async (caseData: CasePublic) => {
    try {
      setError(null);
      setIsProcessing(true);
      
      // Start session with backend
      const response: SessionStartResponse = await interviewApi.startSession({
        case_id: caseData.id,
        student_id: 'demo-student-' + Date.now(), // In production, use real student ID
      });

      setSelectedCase(caseData);
      setSessionId(response.session_id);
      
      // Display initial greeting from patient
      setMessages([{
        role: 'patient',
        content: response.initial_greeting,
      }]);
      
      setIsComplete(false);
      setFeedback(null);
    } catch (err: any) {
      console.error('Error starting interview:', err);
      setError(err.message || 'Failed to start interview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      setError(null);
      setAudioBlob(null);
      await audioRecorder.start((seconds) => setRecordingTime(seconds));
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Microphone access denied. Please allow microphone access to use voice recording.');
    }
  };

  const stopRecording = async () => {
    try {
      const blob = await audioRecorder.stop();
      setAudioBlob(blob);
      setIsRecording(false);
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setError('Failed to stop recording. Please try again.');
    }
  };

  // Send audio to backend
  const sendAudio = async () => {
    if (!audioBlob || !sessionId) return;

    try {
      console.log('\n🚀 ============ SENDING AUDIO TO BACKEND ============');
      console.log('📊 Audio Blob Info:');
      console.log('   - Size:', audioBlob.size, 'bytes');
      console.log('   - Type:', audioBlob.type);
      console.log('   - Recording duration:', recordingTime, 'seconds');
      console.log('   - Session ID:', sessionId);
      
      setIsProcessing(true);
      setError(null);

      // Send audio to K2 reasoning endpoint
      console.log('📤 Sending POST request to /api/reasoning/interact...');
      const startTime = Date.now();
      
      const response = await interviewApi.sendAudioInteraction(sessionId, audioBlob);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Response received in ${duration}s`);
      console.log('📝 Transcription:', response.student_input);
      console.log('🤖 AI Response:', response.tutor_response.substring(0, 100) + '...');
      console.log('🔊 Audio URL:', response.audio_url || 'No audio');

      // Add student message (transcribed)
      const newMessages: Message[] = [
        ...messages,
        {
          role: 'student',
          content: response.student_input,
        },
        {
          role: 'patient',
          content: response.tutor_response,
          audioUrl: response.audio_url,
        },
      ];

      setMessages(newMessages);
      
      // Play audio response if available
      if (response.audio_url) {
        console.log('🎵 Playing audio response...');
        playAudioResponse(response.audio_url);
      } else {
        console.warn('⚠️  No audio URL in response');
      }

      // Reset recording state
      setAudioBlob(null);
      setRecordingTime(0);
      console.log('============ AUDIO SEND COMPLETE ============\n');
    } catch (err: any) {
      console.error('\n❌ ============ AUDIO SEND FAILED ============');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error details:', err);
      console.error('============================================\n');
      setError(err.message || 'Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio response from URL
  const playAudioResponse = (audioUrl: string) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      audio.play();
      setCurrentAudio(audio);

      audio.onended = () => setCurrentAudio(null);
      audio.onerror = (e) => {
        console.error('Error playing audio:', e);
        setCurrentAudio(null);
      };
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  // End interview and get feedback
  const endInterview = async () => {
    if (!sessionId) return;

    try {
      setFeedbackLoading(true);
      setError(null);
      setIsComplete(true);

      const result = await interviewApi.completeSession(sessionId);
      setFeedback(result);
    } catch (err: any) {
      console.error('Error completing session:', err);
      setError(err.message || 'Failed to complete interview. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Reset interview
  const resetInterview = () => {
    // Stop any playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // Cancel any ongoing recording
    if (isRecording) {
      audioRecorder.cancel();
    }

    setSelectedCase(null);
    setSessionId(null);
    setMessages([]);
    setIsComplete(false);
    setFeedback(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setError(null);
  };

  // Case selection view
  if (!selectedCase) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Mock Patient Interviews</h2>
          <p className="text-gray-600">Select a clinical case to practice your patient interview skills</p>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 border-2 border-red-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-900 font-medium">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Interview Platform</h3>
              <p className="text-gray-700 mb-4">
                Practice with AI patients powered by K2 clinical reasoning and ElevenLabs voice synthesis. 
                Speak naturally and receive intelligent Socratic responses to guide your learning.
              </p>
            </div>
          </div>
        </Card>

        {loadingCases ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading clinical cases...</p>
          </Card>
        ) : cases.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((caseData) => (
              <Card key={caseData.id} className="p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{caseData.title}</h3>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Chief Complaint:</span> {caseData.chief_complaint}
                    </div>
                  </div>
                  
                  {caseData.learning_objectives && caseData.learning_objectives.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Learning Objectives:</span>
                      <ul className="mt-1 space-y-1">
                        {caseData.learning_objectives.slice(0, 2).map((obj, idx) => (
                          <li key={idx} className="text-xs">• {obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => startInterview(caseData)}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">No clinical cases available.</p>
            <Button onClick={loadCases} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </Card>
        )}
      </div>
    );
  }

  // Interview view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{selectedCase.title}</h2>
          <p className="text-gray-600">Chief Complaint: {selectedCase.chief_complaint}</p>
        </div>
        <Button onClick={resetInterview} variant="outline" disabled={isProcessing}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Change Case
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-900 font-medium">Error</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'student' ? 'justify-end' : ''}`}>
              {message.role === 'patient' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-4 rounded-lg ${
                  message.role === 'patient'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                }`}
              >
                <p>{message.content}</p>
                {message.audioUrl && (
                  <button
                    onClick={() => playAudioResponse(message.audioUrl!)}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    🔊 Play audio
                  </button>
                )}
              </div>
              {message.role === 'student' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {!isComplete && (
          <div className="space-y-3">
            {/* Voice Recording Section */}
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              {!isRecording && !audioBlob && (
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    Click the microphone to record your question or response
                  </p>
                  <Button
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                </div>
              )}

              {isRecording && (
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-red-600 mb-2 animate-pulse">
                      🔴 {formatRecordingTime(recordingTime)}
                    </div>
                    <p className="text-gray-700">Recording...</p>
                  </div>
                  <Button
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Stop Recording
                  </Button>
                </div>
              )}

              {audioBlob && !isRecording && (
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    ✓ Recording ready ({formatRecordingTime(recordingTime)})
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={startRecording}
                      variant="outline"
                      disabled={isProcessing}
                    >
                      Re-record
                    </Button>
                    <Button
                      onClick={sendAudio}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                onClick={endInterview}
                variant="outline"
                disabled={isProcessing}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Square className="w-4 h-4 mr-2" />
                End Interview
              </Button>
            </div>
          </div>
        )}
      </Card>

      {!isComplete && (
        <Card className="p-4 bg-blue-50 border-2 border-blue-100">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Tip:</span> Use open-ended questions to gather comprehensive information.
              Remember OPQRST: Onset, Provocation, Quality, Radiation, Severity, Time.
            </p>
          </div>
        </Card>
      )}

      {isComplete && (
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete</h3>
            <p className="text-gray-600">
              {selectedCase.title} — {messages.filter(m => m.role === 'student').length} questions asked
            </p>
          </div>

          {feedbackLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Analyzing your interview with K2 AI...</p>
              <p className="text-sm text-gray-400 mt-1">Reviewing your clinical technique and reasoning</p>
            </div>
          )}

          {!feedbackLoading && feedback && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-2">Overall Assessment</h4>
                <p className="text-gray-700">{feedback.evaluation.overall_assessment}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border-2 border-green-100">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {feedback.evaluation.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-lg border-2 border-orange-100">
                  <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {feedback.evaluation.areas_for_improvement.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {feedback.evaluation.key_findings.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-purple-100">
                  <h4 className="font-semibold text-purple-700 mb-2">Key Findings</h4>
                  <ul className="space-y-1">
                    {feedback.evaluation.key_findings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.evaluation.missed_red_flags.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-red-100">
                  <h4 className="font-semibold text-red-700 mb-2">Missed Red Flags</h4>
                  <ul className="space-y-1">
                    {feedback.evaluation.missed_red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Session Summary</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Total interactions: {feedback.summary.total_interactions}</p>
                  <p>• Duration: {feedback.summary.duration_minutes.toFixed(1)} minutes</p>
                  <p>• Questions asked: {feedback.summary.questions_asked}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 justify-center">
            <Button onClick={resetInterview} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Case
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
