import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import { 
  Brain, 
  Play, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Target,
  Calendar,
  Award,
  BookOpen,
  Code,
  Users,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUrl } from '../src/frontend/utils/api';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user stats
      const statsResponse = await fetch(apiUrl('/api/user/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch recent interviews
      const interviewsResponse = await fetch(apiUrl('/api/interview?limit=3'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const interviewsData = await interviewsResponse.json();
      if (interviewsData.success) {
        setRecentInterviews(interviewsData.interviews);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'technical':
        return <Code className="h-5 w-5" />;
      case 'behavioral':
        return <Users className="h-5 w-5" />;
      case 'system-design':
        return <Target className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Ready to practice and improve your interview skills?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/interview" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-primary-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Start New Interview</h3>
                  <p className="text-gray-600 mt-1">Practice with AI interviewer</p>
                </div>
                <Play className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              </div>
            </div>
          </Link>

          <Link href="/history" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View History</h3>
                  <p className="text-gray-600 mt-1">Review past interviews</p>
                </div>
                <Clock className="h-8 w-8 text-green-600 group-hover:text-green-700" />
              </div>
            </div>
          </Link>

          <Link href="/profile" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Update Profile</h3>
                  <p className="text-gray-600 mt-1">Manage your settings</p>
                </div>
                <Settings className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                    {stats.averageScore}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedInterviews}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Interviews</h2>
            </div>
            <div className="p-6">
              {recentInterviews.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No interviews yet. Start your first practice session!</p>
                  <Link
                    href="/interview"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Start Interview
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentInterviews.map((interview) => (
                    <div key={interview._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getInterviewTypeIcon(interview.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {interview.type} Interview
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(interview.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getScoreColor(interview.evaluation?.overallScore || 0)}`}>
                          {interview.evaluation?.overallScore || 'N/A'}%
                        </p>
                        <p className="text-xs text-gray-600 capitalize">{interview.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interview Types Distribution */}
          {stats && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Interview Types</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(stats.typeStats).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getInterviewTypeIcon(type)}
                        <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
                      </div>
                      <span className="text-sm text-gray-600">{count as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Pro Tip</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Practice regularly with different interview types to improve your overall performance. 
                Focus on areas where you score lower and review feedback from completed interviews.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
