import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { User, Bot, Play, RotateCcw, CheckCircle2, AlertCircle, Sparkles, Square, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import apiClient from '../services/api';

interface Message {
  role: 'patient' | 'student';
  content: string;
}

interface CaseData {
  case_id: string;
  case_title: string;
  description: string;
  difficulty: string;
}

interface Scenario extends CaseData {
  id: string;
  title: string;
  patient: string;
  chiefComplaint: string;
  color: string;
}

const initialResponses: Record<string, string[]> = {
  case_001: [
    "Hello, doctor. I've been having this terrible chest pain that started about 2 hours ago.",
    "It feels like pressure, like someone is sitting on my chest. It's really uncomfortable.",
    "It's right here in the center of my chest. It sometimes radiates to my left arm.",
    "No, I've never had anything like this before. I'm really worried.",
  ],
  case_002: [
    "Hi doctor, I have this really bad headache that won't go away.",
    "It started yesterday morning. It's on both sides of my head, throbbing.",
    "Yes, I'm sensitive to light and feel a bit nauseous.",
    "I've tried ibuprofen but it didn't help much.",
  ],
  case_003: [
    "Doctor, I've been having stomach pain for the past 6 hours.",
    "It's in the upper right part of my stomach. It's sharp and comes and goes.",
    "I threw up once this morning. I also feel very nauseated.",
    "I ate some fried food last night at a restaurant.",
  ],
  case_004: [
    "Doctor, I've been experiencing episodes of dizziness and even blacked out briefly today.",
    "It happened when I stood up from sitting. I felt lightheaded and then everything went black.",
    "I have a history of hypertension but I haven't been taking my medications regularly.",
    "I also feel fatigued and have been short of breath lately.",
  ],
  case_005: [
    "Doctor, my child has been running a fever since this morning.",
    "The temperature reached 38.5 degrees Celsius. There's also this strange rash all over the body.",
    "Yes, the rash appeared after the fever started. It's red and slightly raised.",
    "There have been other sick children at school recently.",
  ],
};

export function MockInterview() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [interviewStep, setInterviewStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    overall: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  // Fetch cases from backend
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await apiClient.get('/api/consultations/cases');
        const cases = response.data.map((caseData: CaseData, index: number) => ({
          ...caseData,
          id: caseData.case_id,
          title: caseData.case_title,
          patient: `Patient ${index + 1}`,
          chiefComplaint: caseData.description,
          color: ['red', 'yellow', 'orange', 'blue', 'purple'][index % 5],
        }));
        setScenarios(cases);
      } catch (error) {
        console.error('Failed to fetch cases:', error);
        // Fallback to default scenarios
        setScenarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const startInterview = async (scenario: Scenario) => {
    try {
      // Create consultation in backend
      const response = await apiClient.post('/api/consultations/start', {
        case_id: scenario.case_id,
        case_title: scenario.case_title,
      });

      const newConsultationId = response.data.id;
      setConsultationId(newConsultationId);
      setSelectedScenario(scenario);

      // Get initial patient response
      const responses = initialResponses[scenario.case_id] || [
        "Hello doctor, how can I help you?",
      ];

      setMessages([
        {
          role: 'patient',
          content: responses[0],
        },
      ]);
      setInterviewStep(0);
      setIsComplete(false);
      setCurrentInput('');
      setFeedback(null);
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview');
    }
  };

  const sendMessage = () => {
    if (!currentInput.trim() || !selectedScenario) return;

    const newMessages: Message[] = [
      ...messages,
      {
        role: 'student',
        content: currentInput,
      },
    ];

    const nextStep = interviewStep + 1;
    const responses =
      initialResponses[selectedScenario.case_id] ||
      ['I understand. Is there anything else?'];

    if (nextStep < responses.length) {
      newMessages.push({
        role: 'patient',
        content: responses[nextStep],
      });
      setInterviewStep(nextStep);
    } else {
      setMessages(newMessages);
      setCurrentInput('');
      setIsComplete(true);
      generateFeedback(newMessages);
      return;
    }

    setMessages(newMessages);
    setCurrentInput('');
  };

  const generateFeedback = async (interviewMessages: Message[]) => {
    setFeedbackLoading(true);
    setFeedback(null);

    // TODO: Replace with actual API call
    // Example:
    // const response = await fetch('/api/interviews/feedback', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     scenarioId: selectedScenario,
    //     messages: interviewMessages,
    //   }),
    // });
    // const data = await response.json();
    // setFeedback(data);

    setFeedbackLoading(false);
  };

  const endInterview = () => {
    setIsComplete(true);
    generateFeedback(messages);
  };

  const resetInterview = () => {
    setSelectedScenario(null);
    setConsultationId(null);
    setMessages([]);
    setCurrentInput('');
    setInterviewStep(0);
    setIsComplete(false);
    setFeedback(null);
    setFeedbackLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!selectedScenario) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Mock Patient Interviews</h2>
          <p className="text-gray-600">Select a scenario or generate a custom patient case using AI</p>
        </div>

        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Interview Generation</h3>
              <p className="text-gray-700 mb-4">
                Our platform uses advanced AI (powered by ElevenLabs for voice synthesis and K2 for clinical reasoning) 
                to generate realistic patient scenarios tailored to your learning needs.
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Custom Scenario
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.length > 0 ? (
            scenarios.map((scenario) => (
              <Card key={scenario.id} className="p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{scenario.title}</h3>
                      <Badge
                        variant="secondary"
                        className={`${
                          scenario.difficulty === 'beginner'
                            ? 'bg-green-100 text-green-700'
                            : scenario.difficulty === 'intermediate'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {scenario.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Patient:</span> {scenario.patient}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Chief Complaint:</span> {scenario.chiefComplaint}
                    </div>
                  </div>
                  <Button
                    onClick={() => startInterview(scenario)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 col-span-full text-center">
              <p className="text-gray-500">No scenarios available. Please try again later.</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{selectedScenario?.title}</h2>
          <p className="text-gray-600">{selectedScenario?.patient} - {selectedScenario?.chiefComplaint}</p>
        </div>
        <Button onClick={resetInterview} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Change Scenario
        </Button>
      </div>

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
            <Textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Type your question or response to the patient..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <Button onClick={sendMessage} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Send Message
                </Button>
                <span className="text-sm text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </span>
              </div>
              <Button
                onClick={endInterview}
                variant="outline"
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
              {selectedScenario?.title} — {messages.filter(m => m.role === 'student').length} questions asked
            </p>
          </div>

          {feedbackLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Analyzing your interview...</p>
              <p className="text-sm text-gray-400 mt-1">Our AI is reviewing your clinical technique</p>
            </div>
          )}

          {!feedbackLoading && !feedback && (
            <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <p className="text-gray-500">
                Feedback will appear here once the API is connected.
              </p>
            </div>
          )}

          {feedback && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-2">Overall Assessment</h4>
                <p className="text-gray-700">{feedback.overall}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border-2 border-green-100">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, idx) => (
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
                    {feedback.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 justify-center">
            <Button onClick={resetInterview} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Scenario
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}