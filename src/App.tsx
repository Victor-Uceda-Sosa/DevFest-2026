import React, { useState } from 'react';
import { Home } from './components/Home';
import { MockInterview } from './components/MockInterview';
import { MCATStudy } from './components/MCATStudy';
import { Scheduling } from './components/Scheduling';
import { Activity, Home as HomeIcon, Stethoscope, BookOpen, Calendar } from 'lucide-react';

type Page = 'home' | 'interview' | 'mcat' | 'scheduling';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'interview':
        return <MockInterview />;
      case 'mcat':
        return <MCATStudy />;
      case 'scheduling':
        return <Scheduling />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-green-500 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">MedStudent Pro</h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setCurrentPage('home')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                onClick={() => setCurrentPage('interview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'interview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Interview</span>
              </button>
              <button
                onClick={() => setCurrentPage('mcat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'mcat'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Exams</span>
              </button>
              <button
                onClick={() => setCurrentPage('scheduling')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'scheduling'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}