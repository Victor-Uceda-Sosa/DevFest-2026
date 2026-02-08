import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, BookOpen, GraduationCap, Stethoscope, ChevronRight } from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  fullName: string;
  description: string;
  sections: string[];
  color: string;
  icon: any;
}

interface PerformanceStats {
  summary?: string;
  sectionScores?: { section: string; score: number }[];
  overallScore?: number;
}

const exams: Exam[] = [
  {
    id: 'mcat',
    name: 'MCAT',
    fullName: 'Medical College Admission Test',
    description: 'Standardized exam for medical school admission in the US and Canada',
    sections: ['Biological and Biochemical Foundations', 'Chemical and Physical Foundations', 'Psychological, Social, and Biological Foundations', 'Critical Analysis and Reasoning Skills'],
    color: 'from-purple-500 to-purple-600',
    icon: BookOpen,
  },
  {
    id: 'usmle-step1',
    name: 'USMLE Step 1',
    fullName: 'United States Medical Licensing Examination - Step 1',
    description: 'Assesses understanding and application of basic science concepts',
    sections: ['Anatomy', 'Biochemistry', 'Pharmacology', 'Physiology', 'Pathology', 'Microbiology', 'Immunology'],
    color: 'from-blue-500 to-blue-600',
    icon: GraduationCap,
  },
  {
    id: 'usmle-step2',
    name: 'USMLE Step 2 CK',
    fullName: 'USMLE Step 2 - Clinical Knowledge',
    description: 'Assesses clinical knowledge and patient care skills',
    sections: ['Internal Medicine', 'Surgery', 'Pediatrics', 'Psychiatry', 'Obstetrics & Gynecology', 'Preventive Medicine'],
    color: 'from-green-500 to-green-600',
    icon: Stethoscope,
  },
  {
    id: 'usmle-step3',
    name: 'USMLE Step 3',
    fullName: 'United States Medical Licensing Examination - Step 3',
    description: 'Final step for medical licensure, focusing on patient management',
    sections: ['Ambulatory Care', 'Emergency Medicine', 'Inpatient Medicine', 'Biostatistics & Epidemiology'],
    color: 'from-teal-500 to-teal-600',
    icon: GraduationCap,
  },
  {
    id: 'comlex-1',
    name: 'COMLEX Level 1',
    fullName: 'Comprehensive Osteopathic Medical Licensing Examination - Level 1',
    description: 'Osteopathic medical licensing exam covering basic sciences',
    sections: ['Osteopathic Principles', 'Anatomy', 'Biochemistry', 'Pharmacology', 'Physiology', 'Microbiology'],
    color: 'from-orange-500 to-orange-600',
    icon: BookOpen,
  },
  {
    id: 'comlex-2',
    name: 'COMLEX Level 2',
    fullName: 'Comprehensive Osteopathic Medical Licensing Examination - Level 2',
    description: 'Clinical knowledge and osteopathic medical skills assessment',
    sections: ['Clinical Medicine', 'Osteopathic Manipulative Treatment', 'Patient Care', 'Medical Ethics'],
    color: 'from-red-500 to-red-600',
    icon: Stethoscope,
  },
  {
    id: 'comlex-3',
    name: 'COMLEX Level 3',
    fullName: 'Comprehensive Osteopathic Medical Licensing Examination - Level 3',
    description: 'Assessment of clinical management and osteopathic principles',
    sections: ['Patient Management', 'Osteopathic Recognition & Treatment', 'Clinical Decision Making'],
    color: 'from-pink-500 to-pink-600',
    icon: GraduationCap,
  },
];

export function MCATStudy() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<{ question: string; answer: string; section?: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [statsStatus, setStatsStatus] = useState<'idle' | 'loading' | 'loaded' | 'missing'>('idle');
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [usedGenericPlan, setUsedGenericPlan] = useState(false);

  const currentExam = exams.find((exam) => exam.id === selectedExam);

  const getPerformanceStatsForExam = async (_exam: Exam) => {
    // TODO: Wire this to your data source for user performance analytics.
    // Return null when data is unavailable.
    try {
      return null as PerformanceStats | null;
    } catch {
      return null as PerformanceStats | null;
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadStats = async () => {
      if (!currentExam) {
        return;
      }

      setStatsStatus('loading');
      const stats = await getPerformanceStatsForExam(currentExam);

      if (!isActive) {
        return;
      }

      if (stats) {
        setPerformanceStats(stats);
        setStatsStatus('loaded');
      } else {
        setPerformanceStats(null);
        setStatsStatus('missing');
      }
    };

    loadStats();

    return () => {
      isActive = false;
    };
  }, [currentExam?.id]);

  const getFocusAreasForExam = async (_exam: Exam) => {
    // TODO: Wire this to analytics or user performance data to target weak areas.
    // Return null if data is unavailable to fall back to generic flashcards.
    try {
      return null as string[] | null;
    } catch {
      return null as string[] | null;
    }
  };

  const generateFlashcards = async () => {
    if (!currentExam) {
      return;
    }

    setIsGenerating(true);
    setFlashcardError(null);

    const focusAreas = (await getFocusAreasForExam(currentExam)) ?? [];

    const apiKey = import.meta.env.VITE_DEDALUS_API_KEY;

    if (!apiKey) {
      setFlashcardError('Missing Dedalus API key.');
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch('https://api.dedaluslabs.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You generate concise study flashcards. Return JSON only that matches the provided schema.',
            },
            {
              role: 'user',
              content: [
                `Create 8 flashcards for the ${currentExam.name} exam.`,
                `Exam sections: ${currentExam.sections.join(', ')}.`,
                focusAreas.length > 0
                  ? `Prioritize these weak areas: ${focusAreas.join(', ')}.`
                  : 'No weak areas provided. Balance questions across sections.',
                'Each flashcard must include a question, a short answer, and the best-fit section name.',
              ].join(' '),
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'flashcards',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  flashcards: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        answer: { type: 'string' },
                        section: { type: 'string' },
                      },
                      required: ['question', 'answer', 'section'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['flashcards'],
                additionalProperties: false,
              },
            },
          },
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        throw new Error(`Dedalus API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      setFlashcards(parsed?.flashcards ?? []);
    } catch (error) {
      console.error(error);
      setFlashcardError('Unable to generate flashcards right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStudyPlan = async () => {
    if (!currentExam) {
      return;
    }

    setIsPlanGenerating(true);
    setPlanError(null);
    setUsedGenericPlan(false);

    const apiKey = import.meta.env.VITE_DEDALUS_API_KEY;

    if (!apiKey) {
      setPlanError('Missing Dedalus API key.');
      setIsPlanGenerating(false);
      return;
    }

    const hasStats = Boolean(performanceStats);

    try {
      const response = await fetch('https://api.dedaluslabs.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You generate concise study plans. Return plain text only with each week on its own line.',
            },
            {
              role: 'user',
              content: [
                `Create a study plan for the ${currentExam.name} exam.`,
                `Exam sections: ${currentExam.sections.join(', ')}.`,
                hasStats
                  ? `User performance data: ${JSON.stringify(performanceStats)}.`
                  : 'No user performance data is available. Provide a generic plan balanced across sections.',
                'Format requirement: each week must be on a new line starting with "Week X:". Keep it concise with a short weekly outline and focus areas.',
              ].join(' '),
            },
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Dedalus API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';

      setUsedGenericPlan(!hasStats);
      setStudyPlan(typeof content === 'string' ? content : String(content));
    } catch (error) {
      console.error(error);
      setPlanError('Unable to generate a study plan right now.');
    } finally {
      setIsPlanGenerating(false);
    }
  };

  if (!selectedExam) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Preparation</h2>
          <p className="text-gray-600">Select your exam to access study materials and practice resources</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card
              key={exam.id}
              className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-blue-200 group"
              onClick={() => setSelectedExam(exam.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${exam.color} flex-shrink-0`}>
                    <exam.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {exam.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{exam.fullName}</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{exam.description}</p>
                <div className="flex items-center gap-2 text-blue-600 font-medium pt-2">
                  <span>Enter Study Zone</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Comprehensive Study Platform</h3>
          <p className="text-gray-700">
            Access AI-powered study materials, practice questions, and personalized learning paths for all major medical licensing examinations. 
            Our platform adapts to your learning style and tracks your progress across all exam categories.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => setSelectedExam(null)} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exams
        </Button>
      </div>

      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-xl bg-gradient-to-br ${currentExam?.color} flex-shrink-0`}>
          {currentExam?.icon && <currentExam.icon className="w-8 h-8 text-white" />}
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">{currentExam?.name}</h2>
          <p className="text-lg text-gray-600 mt-1">{currentExam?.fullName}</p>
          <p className="text-gray-700 mt-2">{currentExam?.description}</p>
        </div>
      </div>

      <Card className="p-6 border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
        <h3 className="text-xl font-semibold text-gray-900">Performance Analytics</h3>
        <p className="text-gray-700 mt-2">
          Track your knowledge across {currentExam?.name} subjects.
        </p>
        {statsStatus === 'loading' && (
          <p className="mt-4 text-sm text-gray-500">Loading your performance analytics...</p>
        )}
        {statsStatus === 'missing' && (
          <p className="mt-4 text-sm text-gray-600">
            No performance analytics are available yet. Once your data is connected, your strengths and gaps will appear here.
          </p>
        )}
        {statsStatus === 'loaded' && performanceStats && (
          <div className="mt-4 space-y-3">
            {typeof performanceStats.overallScore === 'number' && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-4 py-2">
                <span className="text-sm text-gray-700">Overall readiness</span>
                <span className="text-sm font-semibold text-emerald-700">{performanceStats.overallScore}%</span>
              </div>
            )}
            {performanceStats.sectionScores && performanceStats.sectionScores.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                {performanceStats.sectionScores.map((entry) => (
                  <div key={entry.section} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-4 py-2">
                    <span className="text-sm text-gray-700">{entry.section}</span>
                    <span className="text-sm font-semibold text-emerald-700">{entry.score}%</span>
                  </div>
                ))}
              </div>
            )}
            {performanceStats.summary && (
              <p className="text-sm text-gray-700">{performanceStats.summary}</p>
            )}
          </div>
        )}
      </Card>

      {/* Exam Sections */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Exam Coverage</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {currentExam?.sections.map((section, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-semibold text-sm">{idx + 1}</span>
              </div>
              <span className="text-gray-900">{section}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Personalized Flashcards</h3>
            <p className="text-gray-700 mt-2">
              Generate flashcards tailored to {currentExam?.name} and your weak areas.
            </p>
          </div>
          <Button
            onClick={generateFlashcards}
            disabled={isGenerating}
            className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800"
          >
            {isGenerating ? 'Generating...' : 'Generate Flashcards'}
          </Button>
        </div>

        {flashcardError && <p className="mt-4 text-sm text-red-600">{flashcardError}</p>}

        {flashcards.length > 0 && (
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {flashcards.map((card, idx) => (
              <Card key={idx} className="p-4 border border-indigo-100 bg-white">
                <div className="flex items-center justify-between">
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                    {card.section || 'General'}
                  </Badge>
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                </div>
                <p className="mt-3 font-semibold text-gray-900">{card.question}</p>
                <p className="mt-2 text-gray-700">{card.answer}</p>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Study Plan</h3>
            <p className="text-gray-700">
              Generate a study plan for {currentExam?.name}. If your performance data is available, it will be tailored to your needs.
            </p>
          </div>
          <Button
            onClick={generateStudyPlan}
            disabled={isPlanGenerating}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isPlanGenerating ? 'Generating...' : 'Generate My Study Plan'}
          </Button>
        </div>

        {planError && <p className="mt-4 text-sm text-red-600">{planError}</p>}

        {studyPlan && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-white p-4">
            {usedGenericPlan && (
              <p className="text-sm text-blue-700 mb-2">
                We could not retrieve your performance data, so this is a generic study plan.
              </p>
            )}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{studyPlan}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

