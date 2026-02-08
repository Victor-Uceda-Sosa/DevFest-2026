import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { Calendar, Clock, Zap, TrendingUp } from 'lucide-react';

interface Consultation {
  id: string;
  case_id: string;
  case_title: string;
  duration_seconds?: number;
  empathy_score?: number;
  clarity_score?: number;
  completeness_score?: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/consultations/');
        setConsultations(response.data);
      } catch (err) {
        console.error('Error fetching consultations:', err);
        setError('Failed to load consultation history');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  // Calculate statistics
  const stats = {
    totalSessions: consultations.length,
    completedSessions: consultations.filter(c => c.status === 'completed').length,
    averageDuration: consultations.length > 0
      ? Math.round(consultations.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / consultations.length / 60)
      : 0,
    averageEmpathy: consultations.length > 0
      ? (consultations.reduce((sum, c) => sum + (c.empathy_score || 0), 0) / consultations.length).toFixed(1)
      : 0,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-900/40">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Profile</h1>
            <p className="mt-2 text-gray-400">{user?.email}</p>
            <p className="text-sm text-gray-500">
              Member since {formatDate(user?.created_at || new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Sessions</p>
                <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
              </div>
              <div className="p-3 bg-blue-900/20 rounded-lg">
                <Zap size={24} className="text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-white">{stats.completedSessions}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Duration</p>
                <p className="text-3xl font-bold text-white">{stats.averageDuration}m</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock size={24} className="text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Empathy Score</p>
                <p className="text-3xl font-bold text-white">{stats.averageEmpathy}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Past Sessions Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-slate-700/50 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Past Consultation Sessions</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div
                  style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '9999px',
                    borderTop: '2px solid rgb(37, 99, 235)',
                    borderRight: 'transparent',
                    borderBottom: '2px solid rgb(37, 99, 235)',
                    borderLeft: 'transparent',
                  }}
                ></div>
                <p className="mt-4 text-gray-400">Loading sessions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400 mb-4">No sessions yet. Start your first interview!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-700/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Case</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Duration</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Scores</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation, index) => (
                    <tr key={consultation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-900/40'}>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-white">{consultation.case_title}</p>
                          <p className="text-xs text-gray-400">{consultation.case_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(consultation.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatTime(consultation.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            consultation.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : consultation.status === 'in_progress'
                              ? 'bg-blue-900/20 text-blue-800'
                              : 'bg-slate-800/50 text-gray-800'
                          }`}
                        >
                          {consultation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {consultation.empathy_score || consultation.clarity_score || consultation.completeness_score ? (
                          <div className="space-y-1">
                            {consultation.empathy_score && (
                              <p>🤝 Empathy: {consultation.empathy_score.toFixed(1)}</p>
                            )}
                            {consultation.clarity_score && (
                              <p>💬 Clarity: {consultation.clarity_score.toFixed(1)}</p>
                            )}
                            {consultation.completeness_score && (
                              <p>✓ Completeness: {consultation.completeness_score.toFixed(1)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
