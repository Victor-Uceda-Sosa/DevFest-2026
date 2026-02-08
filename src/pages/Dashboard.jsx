import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/40">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">MedEd Dashboard</h1>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">
            Welcome, {user?.email}!
          </h2>
          <p className="text-gray-400">
            You are now logged in. This is your dashboard.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: 'Doctor-Patient Consultations',
              description: 'Practice with simulated patients via ElevenLabs',
              icon: '🩺',
              available: true,
              route: '/consultations',
            },
            {
              name: 'Clinical Reasoning',
              description: 'Learn diagnostic reasoning with Praxis',
              icon: '🧠',
            },
            {
              name: 'Study Plan',
              description: 'Manage your study schedule with Daedalus',
              icon: '📅',
            },
            {
              name: 'Ethics & Safety',
              description: 'Practice ethics scenarios with Safetykit',
              icon: '⚖️',
            },
            {
              name: 'Flashcards',
              description: 'AI-powered learning with Featherless',
              icon: '🎴',
            },
            {
              name: 'Visuals',
              description: 'Generate medical diagrams with Figma',
              icon: '🎨',
            },
          ].map((feature) => (
            <div
              key={feature.name}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.name}
              </h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
              {feature.available ? (
                <button
                  onClick={() => navigate(feature.route)}
                  className="mt-4 inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Open
                </button>
              ) : (
                <button className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed">
                  Coming Soon
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
