import React, { useState } from 'react';
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

  const currentExam = exams.find((exam) => exam.id === selectedExam);

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

      {/* Content Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Study Materials</h3>
            </div>
            <p className="text-gray-600">
              Access comprehensive study guides, flashcards, and notes organized by topic
            </p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              Browse Materials
            </Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Practice Questions</h3>
            </div>
            <p className="text-gray-600">
              Test your knowledge with thousands of practice questions and detailed explanations
            </p>
            <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
              Start Practice
            </Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Full-Length Exams</h3>
            </div>
            <p className="text-gray-600">
              Simulate the real exam experience with timed full-length practice tests
            </p>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              Take Practice Exam
            </Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-100">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Performance Analytics</h3>
            </div>
            <p className="text-gray-600">
              Track your progress and identify weak areas with AI-powered analytics
            </p>
            <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800">
              View Analytics
            </Button>
          </div>
        </Card>
      </div>

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

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 AI-Powered Study Plan</h3>
        <p className="text-gray-700 mb-4">
          Our intelligent system creates a personalized study schedule based on your target exam date, 
          current knowledge level, and learning pace. Get started with your customized study plan today.
        </p>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          Generate My Study Plan
        </Button>
      </Card>
    </div>
  );
}
