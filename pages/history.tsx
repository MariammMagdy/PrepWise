import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import { FileText, Clock, Target, CheckCircle, XCircle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUrl } from '../src/frontend/utils/api';

const HistoryPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchInterviews(token);
  }, [router]);

  const fetchInterviews = async (token: string, page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/interview?page=${page}&limit=10`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setInterviews(data.interviews);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to load interview history');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (!user) return <div className="min-h-screen bg-gray-50"><Navbar user={user} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
          <p className="text-gray-600 mt-2">Review your past interviews and track your progress</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-primary-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Loading your interviews...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
            <p className="text-gray-600 mb-6">Start your first practice interview to see your history here.</p>
            <button
              onClick={() => router.push('/interview')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Start Interview
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div
                  key={interview._id}
                  onClick={() => interview.status === 'completed' && router.push(`/interview/${interview._id}/review`)}
                  className={`bg-white rounded-lg shadow p-6 ${interview.status === 'completed' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(interview.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {interview.type} — {interview.subType}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDate(interview.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {interview.evaluation?.overallScore !== undefined && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary-600">
                            {interview.evaluation.overallScore}%
                          </p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 capitalize">{interview.difficulty}</span>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchInterviews(localStorage.getItem('token')!, page)}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.page === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 border hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;