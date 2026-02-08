import React from 'react';
import { Stethoscope, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';

interface HomeProps {
  onNavigate: (page: 'home' | 'interview' | 'mcat' | 'scheduling') => void;
}

export function Home({ onNavigate }: HomeProps) {
  const features = [
    {
      id: 'interview',
      title: 'Mock Patient Interviews',
      description: 'Practice your patient communication skills with AI-generated realistic interview simulations',
      icon: Stethoscope,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      id: 'mcat',
      title: 'Exam Preparation',
      description: 'Study resources for MCAT, USMLE, COMLEX and other medical licensing examinations',
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      id: 'scheduling',
      title: 'Study Scheduling',
      description: 'Organize your study time, rotations, and important deadlines with AI recommendations',
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-4xl font-bold text-white">
          Welcome to <span className="text-cyan-400">K2 Think</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          AI-powered clinical reasoning tutor for medical students
        </p>
        <p className="text-base text-gray-500 max-w-2xl mx-auto">
          Upload a paper, let agents distill it into concepts, videos, and living notebooks
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-blue-200 group"
            onClick={() => onNavigate(feature.id as any)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} flex-shrink-0`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
                <div className="flex items-center gap-2 text-blue-600 font-medium pt-2">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Tips */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Quick Tip</h3>
        <p className="text-gray-700">
          Start your day with an AI-generated mock interview, then use the diagnosis analysis tool to reinforce your clinical reasoning. 
          Schedule regular study sessions to maintain consistent progress across all your exams!
        </p>
      </Card>
    </div>
  );
}