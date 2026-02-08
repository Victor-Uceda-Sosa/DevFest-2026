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
      title: 'Patient Interviews',
      description: 'Practice clinical reasoning with AI-powered patient simulations and voice interactions',
      icon: Stethoscope,
    },
    {
      id: 'mcat',
      title: 'Exam Preparation',
      description: 'Study resources and practice questions for MCAT, USMLE, and COMLEX examinations',
      icon: BookOpen,
    },
    {
      id: 'scheduling',
      title: 'Study Scheduling',
      description: 'Organize study time and track your progress with intelligent recommendations',
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl px-4">
        <h1 className="text-6xl font-bold leading-tight">
          <span className="text-foreground">Welcome to </span>
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            K2 Think
          </span>
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
          AI-powered clinical reasoning tutor for medical students
        </p>
        <p className="text-muted-foreground/70 text-base max-w-xl mx-auto">
          Upload a paper, let agents distill it into concepts, videos, and living notebooks
        </p>
      </div>

      {/* Upload Section - inspired by ClarifAI */}
      <div className="w-full max-w-3xl px-4">
        <Card className="bg-card/50 border-border hover:border-muted-foreground/30 transition-all duration-300 backdrop-blur-sm">
          <div 
            className="p-12 text-center cursor-pointer group"
            onClick={() => onNavigate('interview')}
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="w-10 h-10 text-blue-400" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground text-lg font-medium">
                  Start your clinical interview
                </p>
                <p className="text-muted-foreground text-sm">
                  Practice with AI patients and develop your diagnostic skills
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className="bg-card/30 border-border hover:border-muted-foreground/30 hover:bg-card/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm"
            onClick={() => onNavigate(feature.id as any)}
          >
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Explore</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}