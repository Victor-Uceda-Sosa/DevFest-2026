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

      {/* Featured Interview Section */}
      <Card className="p-12 border-2 border-cyan-500/30 bg-gradient-to-b from-slate-900 to-slate-950 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer" onClick={() => onNavigate('interview')}>
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="p-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">
              Start your clinical interview
            </h3>
            <p className="text-gray-400">
              Practice with AI patients and develop your diagnostic skills
            </p>
          </div>
        </div>
      </Card>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className="p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer border-2 border-slate-700 bg-slate-900/50 hover:border-cyan-500/50 group"
            onClick={() => onNavigate(feature.id as any)}
          >
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}