import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../../components/layout/Navbar';
import {
  Brain, CheckCircle, AlertCircle, Zap, Clock,
  Target, Code, Users, ArrowLeft, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUrl } from '../../../src/frontend/utils/api';

const ReviewPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversation'>('overview');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));

    if (id) fetchInterview(token, id as string);
  }, [router, id]);

  const fetchInterview = async (token: string, interviewId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/interview/${interviewId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setInterview(data.interview);
      } else {
        toast.error('Failed to load interview');
        router.push('/history');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      router.push('/history');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return <Code className="h-5 w-5" />;
      case 'behavioral': return <Users className="h-5 w-5" />;
      case 'system-design': return <Target className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-primary-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading interview review...</p>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.push('/history')}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to History</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              {getTypeIcon(interview.type)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {interview.type} Interview — {interview.subType}
                </h1>
                <p className="text-gray-500">{formatDate(interview.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {interview.metadata?.duration && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(interview.metadata.duration)}</span>
                </div>
              )}
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">
                  {interview.evaluation?.overallScore ?? '—'}%
                </p>
                <p className="text-xs text-gray-500">Overall Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('conversation')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'conversation'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Conversation</span>
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && interview.evaluation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Overall Score', value: `${interview.evaluation.overallScore}%`, color: 'text-primary-600' },
                { label: 'Questions', value: interview.metadata?.questionCount ?? '—', color: 'text-gray-900' },
                { label: 'Difficulty', value: interview.difficulty, color: 'text-gray-900' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-lg shadow p-6 text-center">
                  <p className={`text-3xl font-bold capitalize ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths</h3>
                {interview.evaluation.strengths?.length > 0 ? (
                  <ul className="space-y-2">
                    {interview.evaluation.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No strengths recorded.</p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
                {interview.evaluation.weaknesses?.length > 0 ? (
                  <ul className="space-y-2">
                    {interview.evaluation.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{w}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No weaknesses recorded.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Tips</h3>
              {interview.evaluation.improvementTips?.length > 0 ? (
                <ul className="space-y-2">
                  {interview.evaluation.improvementTips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No tips recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* Conversation Tab */}
        {activeTab === 'conversation' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              {interview.conversation?.length > 0 ? (
                interview.conversation.map((message: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.role === 'interviewer'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-gray-50 border-l-4 border-gray-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {message.role === 'interviewer'
                          ? <Brain className="h-5 w-5 text-blue-600" />
                          : <Users className="h-5 w-5 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 mb-1 capitalize">{message.role}</p>
                        <p className="text-gray-900">{message.content}</p>
                        {message.answerEvaluation && (
                          <div className="mt-3 p-3 bg-white rounded border text-sm">
                            <p className="font-medium text-gray-700">
                              Score: {message.answerEvaluation.score}/100
                            </p>
                            <p className="text-gray-600 mt-1">{message.answerEvaluation.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">No conversation recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;