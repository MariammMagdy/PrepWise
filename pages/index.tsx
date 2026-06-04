import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Brain, Target, TrendingUp, Users, Play, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Interviews',
      description: 'Advanced AI interviewer that adapts to your performance and asks relevant follow-up questions',
      color: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Real-time Evaluation',
      description: 'Get instant feedback on your answers with detailed scoring and improvement suggestions',
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Adaptive Difficulty',
      description: 'Questions adjust based on your performance to keep you challenged but not overwhelmed',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Multiple Interview Types',
      description: 'Practice technical, behavioral, and system design interviews tailored to your role',
      color: 'text-orange-600'
    }
  ];

  const interviewTypes = [
    {
      type: 'Technicall',
      subTypes: ['Backend', 'Applied Skills', 'DSA'],
      description: 'Test your technical knowledge',
      color: 'bg-blue-500'
    },
    {
      type: 'Behavioral',
      subTypes: ['General', 'Leadership', 'Teamwork'],
      description: 'Practice soft skills and cultural fit questions',
      color: 'bg-green-500'
    },
    {
      type: 'HR',
      subTypes: ['Career', 'Scalability', 'Collaboration'],
      description: 'Practice human resources questions',
      color: 'bg-purple-500'
    }
  ];

  if (user) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Master Your Next Interview with
              <span className="block text-yellow-300">AI-Powered Practice</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Practice interviews with our intelligent AI interviewer that adapts to your skill level 
              and provides real-time feedback to help you land your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary bg-yellow-400 text-gray-900 hover:bg-yellow-300 px-8 py-4 text-lg font-semibold">
                <Play className="inline-block w-5 h-5 mr-2" />
                Start Free Trial
              </Link>
              <Link href="/demo" className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold">
                Watch Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PrepWise?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides the most realistic interview practice experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6">
                  <div className={`w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interview Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Interview Practice
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Practice different types of interviews to prepare for any scenario
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {interviewTypes.map((interview, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className={`h-2 ${interview.color}`}></div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {interview.type}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {interview.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {interview.subTypes.map((subType, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {subType}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    Practice {interview.type}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of candidates who have improved their interview skills with PrepWise
          </p>
          <Link href="/signup" className="btn-primary bg-yellow-400 text-gray-900 hover:bg-yellow-300 px-8 py-4 text-lg font-semibold">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6" />
              <span className="text-xl font-bold">PrepWise</span>
            </div>
            <div className="text-gray-400">
              © 2024 PrepWise. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
