import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { User, Bot, Play, RotateCcw, CheckCircle2, AlertCircle, Sparkles, Square, Loader2, Mic, Send } from 'lucide-react';
import { Badge } from './ui/badge';
import { AudioRecorder, formatRecordingTime } from '../utils/audioRecorder';
import { MedicalImages } from './MedicalImages';
import interviewApi from '../services/interviewApi';
import dedalusApi from '../services/dedalusApi';
import { demoCases } from '../data/demoMedicalCases';
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

  // Dedalus literature generation state
  const [generatingFromLiterature, setGeneratingFromLiterature] = useState(false);
  const [medicalCondition, setMedicalCondition] = useState('');
  const [caseDifficulty, setCaseDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showLiteratureGenerator, setShowLiteratureGenerator] = useState(false);

  // Load cases on component mount
  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      setError(null);
      try {
        const fetchedCases = await interviewApi.getCases();
        // Merge API cases with demo cases (demo cases have medical images for Dedalus multimodality)
        const mergedCases = [...demoCases, ...fetchedCases.filter((apiCase: CasePublic) =>
          !demoCases.find(demoCase => demoCase.id === apiCase.id)
        )];
        setCases(mergedCases);
      } catch (apiErr) {
        console.warn('API cases unavailable, using demo cases with medical images:', apiErr);
        // Fall back to demo cases with medical images
        setCases(demoCases);
      }
    } catch (err: any) {
      console.error('Error loading cases:', err);
      setError(err.message || 'Failed to load clinical cases. Please refresh the page.');
    } finally {
      setLoadingCases(false);
    }
  };

  // Generate case from medical literature using Dedalus
  const generateCaseFromLiterature = async () => {
    if (!medicalCondition.trim()) {
      setError('Please enter a medical condition');
      return;
    }

    try {
      setGeneratingFromLiterature(true);
      setError(null);
      console.log(`🔍 Dedalus: Generating ${caseDifficulty} case for ${medicalCondition} from medical literature`);

      const response = await dedalusApi.generateCaseFromLiterature({
        medical_condition: medicalCondition,
        difficulty: caseDifficulty,
      });

      if (response.case) {
        // Convert to CasePublic format and add to cases
        const generatedCase: CasePublic = {
          id: `dedalus-${Date.now()}`,
          title: response.case.title,
          chief_complaint: response.case.chief_complaint,
          learning_objectives: response.case.learning_objectives,
        };

        setCases((prev) => [generatedCase, ...prev]);
        setSelectedCase(generatedCase);
        setShowLiteratureGenerator(false);
        setMedicalCondition('');
        console.log(`✅ Generated case from literature: ${response.case.title}`);
        console.log(`📚 Literature reference: ${response.literature_reference}`);
      }
    } catch (err: any) {
      console.error('Error generating case from literature:', err);
      setError(`Failed to generate case: ${err.message}`);
    } finally {
      setGeneratingFromLiterature(false);
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

      // Display initial greeting from patient with audio
      setMessages([{
        role: 'patient',
        content: response.initial_greeting,
        audioUrl: response.greeting_audio_url || null,
      }]);

      // Play greeting audio if available
      if (response.greeting_audio_url) {
        console.log('🔊 Playing initial greeting audio...');
        setTimeout(() => playAudioResponse(response.greeting_audio_url), 500);
      }

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
    if (!audioBlob) {
      alert('❌ No audio recording. Please record something first.');
      return;
    }

    if (!sessionId) {
      alert('❌ No session ID. Please start an interview first.');
      return;
    }

    try {
      console.log('\n🚀 ============ SENDING AUDIO TO BACKEND ============');
      console.log('📊 Audio Blob Info:');
      console.log('   - Size:', audioBlob.size, 'bytes');
      console.log('   - Type:', audioBlob.type);
      console.log('   - Recording duration:', recordingTime, 'seconds');
      console.log('   - Session ID:', sessionId);

      setIsProcessing(true);
      setError(null);

      const startTime = Date.now();
      console.log('📤 POST request to /api/reasoning/interact...');

      // Add student message immediately (for live transcript effect)
      let studentInputText = '';

      // Send audio and get response
      const response = await interviewApi.sendInteraction(
        sessionId,
        { audio: audioBlob }
      );

      studentInputText = response.student_input;
      console.log('✅ Response received:');
      console.log('   📝 Student input (transcript):', studentInputText);
      console.log('   🤖 Tutor response:', response.tutor_response.substring(0, 100) + '...');
      console.log('   🔊 Audio URL:', response.audio_url);

      // Add student message immediately
      setMessages(prev => [...prev, {
        role: 'student',
        content: studentInputText,
      }]);

      // Add patient message with empty content (will stream it in)
      const patientMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, {
        role: 'patient',
        content: '',
        audioUrl: response.audio_url || null,
      }]);

      // Stream the response character by character (typing effect)
      const fullResponse = response.tutor_response;
      let charIndex = 0;
      const streamChar = () => {
        if (charIndex < fullResponse.length) {
          charIndex++;
          setMessages(prev => {
            const updated = [...prev];
            if (updated[patientMessageIndex]) {
              updated[patientMessageIndex].content = fullResponse.substring(0, charIndex);
            }
            return updated;
          });
          // Adjust speed based on text length (faster for short responses)
          const delay = fullResponse.length > 100 ? 10 : 15;
          setTimeout(streamChar, delay);
        } else if (response.audio_url) {
          // Once text is fully streamed, play audio
          console.log('🔊 Playing audio from URL:', response.audio_url);
          playAudioResponse(response.audio_url);
        }
      };

      // Start streaming text
      streamChar();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Complete in ${duration}s`);

      // Reset recording state
      setAudioBlob(null);
      setRecordingTime(0);
      console.log('============ AUDIO SEND COMPLETE ============\n');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process audio. Please try again.';
      console.error('\n❌ ============ AUDIO SEND FAILED ============');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error details:', err);
      console.error('============================================\n');
      setError(errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio chunks as they arrive from the stream
  const playAudioChunk = (chunk: Uint8Array) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const blob = new Blob([chunk], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      // Queue the chunk for playback
      if (currentAudio) {
        // Wait for current audio to finish before playing next chunk
        currentAudio.onended = () => {
          const audio = new Audio(url);
          audio.play();
          setCurrentAudio(audio);
          audio.onended = () => setCurrentAudio(null);
        };
      } else {
        const audio = new Audio(url);
        audio.play();
        setCurrentAudio(audio);
        audio.onended = () => setCurrentAudio(null);
      }
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  };

  // Play audio response from URL
  const playAudioResponse = (audioUrl: string) => {
    try {
      console.log('🎵 Creating audio element for URL:', audioUrl);

      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      console.log('🎵 Audio element created');

      audio.onerror = (e) => {
        console.error('❌ Audio playback error:', e);
        console.error('Audio error details:', (audio as any).error);
      };

      audio.oncanplay = () => {
        console.log('✅ Audio can play, duration:', audio.duration, 'seconds');
      };

      const playPromise = audio.play();
      console.log('🎵 Calling play()...');

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback started');
            setCurrentAudio(audio);
          })
          .catch((err) => {
            console.error('❌ Play failed:', err.name, err.message);
          });
      }

      audio.onended = () => {
        console.log('🎵 Audio playback ended');
        setCurrentAudio(null);
      };
    } catch (err) {
      console.error('❌ Failed to create audio element:', err);
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
      console.log('📋 Feedback received:', result);
      setFeedback(result);

      // Save session data for flashcard personalization
      const sessionData = {
        sessionId,
        caseId: selectedCase?.id,
        timestamp: new Date().toISOString(),
        feedback: result,
        studentInputs: messages.filter(m => m.role === 'student').map(m => m.content),
        patientResponses: messages.filter(m => m.role === 'patient').map(m => m.content),
      };

      // Store in localStorage for flashcard generation
      const recentSessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
      recentSessions.push(sessionData);
      // Keep only last 5 sessions
      localStorage.setItem('recentSessions', JSON.stringify(recentSessions.slice(-5)));
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
          <h2 className="text-3xl font-bold text-white mb-2">Mock Patient Interviews</h2>
          <p className="text-gray-400">Select a clinical case to practice your patient interview skills</p>
        </div>

        {error && (
          <Card className="p-4 bg-red-900/20 border border-red-500/30">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">Error</p>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-slate-900/40 border border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/15 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Interview Platform</h3>
              <p className="text-gray-400 mb-4">
                Practice with AI patients powered by Praxis clinical reasoning and ElevenLabs voice synthesis.
                Speak naturally and receive intelligent Socratic responses to guide your learning.
              </p>
            </div>
          </div>
        </Card>

        {/* Dedalus Literature Generator */}
        <Card className="p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Generate Case from Medical Literature</h3>
              <p className="text-sm text-gray-400 mb-4">
                Use Dedalus to search medical literature and generate realistic clinical cases based on actual documented cases.
              </p>
              <Button
                onClick={() => setShowLiteratureGenerator(!showLiteratureGenerator)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {showLiteratureGenerator ? 'Hide' : 'Generate from Literature'}
              </Button>

              {showLiteratureGenerator && (
                <div className="mt-4 space-y-4 p-4 rounded-lg bg-black/20 border border-purple-500/20">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Medical Condition
                    </label>
                    <input
                      type="text"
                      value={medicalCondition}
                      onChange={(e) => setMedicalCondition(e.target.value)}
                      placeholder="e.g., Acute Myocardial Infarction, Sepsis, Stroke"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={caseDifficulty}
                      onChange={(e) => setCaseDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="easy">Easy (Clear diagnosis)</option>
                      <option value="medium">Medium (Some complexity)</option>
                      <option value="hard">Hard (Diagnostic challenge)</option>
                    </select>
                  </div>

                  <Button
                    onClick={generateCaseFromLiterature}
                    disabled={generatingFromLiterature || !medicalCondition.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {generatingFromLiterature ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating from Literature...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Case
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {loadingCases ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading clinical cases...</p>
          </Card>
        ) : cases.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((caseData) => (
              <Card key={caseData.id} className="p-6 hover:border-blue-500/50 transition-all border border-slate-700/50 bg-slate-900/30">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{caseData.title}</h3>
                    <div className="text-sm text-gray-400">
                      <span className="font-medium">Chief Complaint:</span> {caseData.chief_complaint}
                    </div>
                  </div>

                  {caseData.learning_objectives && caseData.learning_objectives.length > 0 && (
                    <div className="text-sm text-gray-400">
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
                    className="w-full bg-cyan-500 hover:bg-cyan-400"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-slate-900/40 border border-slate-700/50">
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
          <h2 className="text-3xl font-bold text-white">{selectedCase.title}</h2>
          <p className="text-gray-400">Chief Complaint: {selectedCase.chief_complaint}</p>
        </div>
        <Button onClick={resetInterview} variant="outline" disabled={isProcessing}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Change Case
        </Button>
      </div>

      {/* Medical Images - Multimodal Integration with Dedalus */}
      {selectedCase.medical_images && selectedCase.medical_images.length > 0 && (
        <MedicalImages
          images={selectedCase.medical_images}
          title="Medical Imaging & Findings"
        />
      )}

      {error && (
        <Card className="p-4 bg-red-900/20 border border-red-500/30">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-300 font-medium">Error</p>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-slate-900/40 border border-slate-700/50">
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
                    ? 'bg-slate-700/50 text-gray-100'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
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
            <div className="p-6 bg-slate-900/40 rounded-lg border border-blue-500/30">
              {!isRecording && !audioBlob && (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">
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
                    <div className="text-3xl font-bold text-red-500 mb-2 animate-pulse">
                      🔴 {formatRecordingTime(recordingTime)}
                    </div>
                    <p className="text-gray-400">Recording...</p>
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
                  <p className="text-gray-400 mb-4">
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
        <Card className="p-4 bg-blue-900/20 border border-blue-500/30">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-300">
              <span className="font-semibold">Tip:</span> Use open-ended questions to gather comprehensive information.
              Remember OPQRST: Onset, Provocation, Quality, Radiation, Severity, Time.
            </p>
          </div>
        </Card>
      )}

      {isComplete && (
        <Card className="p-8 bg-slate-900/40 border border-slate-700/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Interview Complete</h3>
            <p className="text-gray-400">
              {selectedCase.title} — {messages.filter(m => m.role === 'student').length} questions asked
            </p>
          </div>

          {feedbackLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <p className="text-gray-300 font-medium">Analyzing your interview with Praxis AI...</p>
              <p className="text-sm text-gray-500 mt-1">Reviewing your clinical technique and reasoning</p>
            </div>
          )}

          {!feedbackLoading && feedback && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-blue-500/30">
                <h4 className="font-semibold text-white mb-2">Overall Assessment</h4>
                <p className="text-gray-300">{feedback.evaluation?.overall_assessment || "Assessment pending..."}</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 rounded-lg border border-emerald-500/50">
                <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Correct Answer
                </h4>
                <div className="space-y-3 text-gray-200">
                  <div>
                    <p className="text-xs text-emerald-300 uppercase tracking-wide font-semibold">Primary Diagnosis</p>
                    <p className="text-lg font-bold text-emerald-100">
                      {feedback.evaluation?.sample_diagnosis || "Loading diagnosis..."}
                    </p>
                  </div>

                  {feedback.evaluation?.full_differential_diagnoses && Object.keys(feedback.evaluation.full_differential_diagnoses).length > 0 && (
                    <div>
                      <p className="text-xs text-emerald-300 uppercase tracking-wide font-semibold">Differential Diagnoses</p>
                      <div className="text-sm space-y-2 mt-1">
                        {Object.entries(feedback.evaluation.full_differential_diagnoses).map(([key, value]: any, idx) => {
                          // Format key: convert primary_diagnosis to "Primary Diagnosis"
                          const formattedKey = key
                            .replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                          return (
                            <div key={idx} className="bg-slate-900/40 p-2 rounded">
                              <p className="text-emerald-300 font-semibold">{formattedKey}</p>
                              <p className="text-gray-300">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {feedback.summary?.red_flags_coverage && (
                    <div>
                      <p className="text-xs text-emerald-300 uppercase tracking-wide font-semibold">Red Flags Coverage</p>
                      <p className="text-sm">{feedback.summary.red_flags_coverage}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {(feedback.evaluation?.strengths || []).map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-orange-500/30">
                  <h4 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {(feedback.evaluation?.areas_for_improvement || []).map((improvement, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {(feedback.evaluation?.key_findings?.length || 0) > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-purple-400 mb-2">Key Findings</h4>
                  <ul className="space-y-1">
                    {(feedback.evaluation?.key_findings || []).map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-300">• {finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(feedback.evaluation?.missed_red_flags?.length || 0) > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Missed Red Flags</h4>
                  <ul className="space-y-1">
                    {(feedback.evaluation?.missed_red_flags || []).map((flag, idx) => (
                      <li key={idx} className="text-sm text-gray-300">• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
                <h4 className="font-semibold text-white mb-2">Session Summary</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• Total interactions: {feedback.summary?.total_interactions || 0}</p>
                  <p>• Duration: {(feedback.summary?.duration_minutes || 0).toFixed(1)} minutes</p>
                  <p>• Questions asked: {feedback.summary?.questions_asked || 0}</p>
                  <p>• Red flags caught: {feedback.summary?.red_flags_coverage || "0/0"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 justify-center">
            <Button onClick={resetInterview} className="bg-cyan-500 hover:bg-cyan-400">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Case
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
