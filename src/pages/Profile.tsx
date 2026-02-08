import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Calendar, Clock, Award, Zap } from 'lucide-react';
import apiClient from '../services/api';

interface Consultation {
  id: string;
  case_name: string;
  case_id: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  status: string;
  scores?: {
    empathy?: number;
    clarity?: number;
    completeness?: number;
  };
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
        const response = await apiClient.get('/api/consultations/');
        setConsultations(response.data || []);
      } catch (err) {
        console.error('Error fetching consultations:', err);
        setError('Failed to load consultation history');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConsultations();
    }
  }, [user]);

  // Calculate stats
  const totalSessions = consultations.length;
  const completedSessions = consultations.filter(c => c.status === 'completed' || c.completed_at).length;
  const avgDuration = consultations.length > 0
    ? Math.round(consultations.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / consultations.length)
    : 0;

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
        <p className="text-gray-400">View your progress and past consultation sessions</p>
      </div>

      {/* User Info Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-cyan-500/30">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-xl font-semibold text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Member Since</p>
            <p className="text-lg text-cyan-400">{joinDate}</p>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-900/20 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{totalSessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/30 to-emerald-900/20 border border-emerald-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-white">{completedSessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-cyan-900/30 to-cyan-900/20 border border-cyan-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Duration</p>
              <p className="text-2xl font-bold text-white">{avgDuration} min</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-900/20 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-white">
                {consultations.filter(c => {
                  const date = new Date(c.started_at);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Past Sessions</h2>

        {loading ? (
          <Card className="p-8 bg-slate-800/30 border border-slate-700/50 text-center">
            <p className="text-gray-400">Loading sessions...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 bg-red-900/20 border border-red-500/30">
            <p className="text-red-400">{error}</p>
          </Card>
        ) : consultations.length === 0 ? (
          <Card className="p-8 bg-slate-800/30 border border-slate-700/50 text-center">
            <p className="text-gray-400">No sessions yet. Start your first interview!</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Case</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Scores</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((consultation) => {
                  const startDate = new Date(consultation.started_at);
                  const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={consultation.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-white font-medium">{consultation.case_name || 'Unknown Case'}</p>
                          <p className="text-gray-500 text-xs">{consultation.case_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        <div>{dateStr}</div>
                        <div className="text-xs text-gray-500">{timeStr}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {consultation.duration_minutes ? `${consultation.duration_minutes} min` : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.status === 'completed' || consultation.completed_at
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : consultation.status === 'in_progress'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-slate-500/20 text-gray-400'
                        }`}>
                          {consultation.status === 'completed' || consultation.completed_at ? 'Completed' : consultation.status || 'In Progress'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {consultation.scores ? (
                          <div className="space-y-1">
                            {consultation.scores.empathy !== undefined && (
                              <div className="text-gray-400">
                                Empathy: <span className="text-cyan-400">{consultation.scores.empathy}/10</span>
                              </div>
                            )}
                            {consultation.scores.clarity !== undefined && (
                              <div className="text-gray-400">
                                Clarity: <span className="text-cyan-400">{consultation.scores.clarity}/10</span>
                              </div>
                            )}
                            {consultation.scores.completeness !== undefined && (
                              <div className="text-gray-400">
                                Completeness: <span className="text-cyan-400">{consultation.scores.completeness}/10</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No scores</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
