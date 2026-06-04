import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import { 
  Brain, 
  Play, 
  Settings, 
  Clock, 
  Target,
  Code,
  Users,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUrl } from '../src/frontend/utils/api';

const InterviewPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentInterview, setCurrentInterview] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [subtypes, setSubtypes] = useState<string[]>([]);
  const [isLoadingSubtypes, setIsLoadingSubtypes] = useState(false);
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(1);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const router = useRouter();

  const [interviewSettings, setInterviewSettings] = useState({
    type: 'technical',
    subType: '',
    difficulty: 'medium',
    duration: 30,
    adaptiveMode: true,
    voiceMode: false,
    codingMode: false,
    jobTitle: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    // Always fetch fresh user data from server
    const fetchFreshUser = async () => {
      try {
        const response = await fetch(apiUrl('/api/auth/me'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);

          // Pre-fill jobTitle if it exists
          if (data.user?.profile?.jobTitle) {
            setInterviewSettings(prev => ({
              ...prev,
              jobTitle: data.user.profile.jobTitle
            }));
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        // Fallback to localStorage if server unreachable
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser?.profile?.jobTitle) {
          setInterviewSettings(prev => ({
            ...prev,
            jobTitle: parsedUser.profile.jobTitle
          }));
        }
      }
    };

    fetchFreshUser();
  }, [router]);

  useEffect(() => {
    if (user?.profile?.jobTitle) {
      setInterviewSettings(prev => ({
        ...prev,
        jobTitle: user.profile.jobTitle
      }));
    }
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInterviewStarted && !isInterviewCompleted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && isInterviewStarted) {
      handleCompleteInterview();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isInterviewStarted, isInterviewCompleted]);

  useEffect(() => {
    const fetchSubtypes = async () => {
      if (!interviewSettings.jobTitle.trim()) {
        setSubtypes([]);
        return;
      }

      setIsLoadingSubtypes(true);
      try {
        const response = await fetch(apiUrl('/api/ai/generate-subtypes'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: interviewSettings.jobTitle,
            interviewType: interviewSettings.type
          })
        });
        const data = await response.json();
        if (data.success) {
          setSubtypes(data.subtypes);
          setInterviewSettings(prev => ({
            ...prev,
            subType: data.subtypes[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
          }));
        }
      } catch (error) {
        console.error('Failed to fetch subtypes');
      } finally {
        setIsLoadingSubtypes(false);
      }
    };

    // Debounce — wait 800ms after user stops typing before calling API
    const timer = setTimeout(fetchSubtypes, 800);
    return () => clearTimeout(timer);
  }, [interviewSettings.jobTitle, interviewSettings.type]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(apiUrl('/api/interview/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: interviewSettings.type,
          subType: interviewSettings.subType,
          difficulty: interviewSettings.difficulty,
          settings: {
            duration: interviewSettings.duration,
            adaptiveMode: interviewSettings.adaptiveMode,
            voiceMode: interviewSettings.voiceMode,
            codingMode: interviewSettings.codingMode
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentInterview(data.interview);
        setIsInterviewStarted(true);
        setTimeLeft(interviewSettings.duration * 60);
        setConversation([{
          role: 'interviewer',
          content: data.interview.questions[0].question,
          questionId: data.interview.questions[0].id,
          timestamp: new Date()
        }]);
        toast.success('Interview started! Good luck!');
      } else {
        toast.error(data.message || 'Failed to start interview');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !currentInterview) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const currentQuestion = currentInterview.questions[currentQuestionIndex];
      
      const response = await fetch(apiUrl(`/api/interview/${currentInterview._id}/answer`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: currentAnswer,
          timeTaken: (interviewSettings.duration * 60 - timeLeft)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add user answer to conversation
        const userMessage = {
          role: 'candidate',
          content: currentAnswer,
          questionId: currentQuestion.id,
          timestamp: new Date(),
          answerEvaluation: data.evaluation,
          behavioralAnalysis: data.behavioralAnalysis
        };

        const updatedConversation = [...conversation, userMessage];
        
        // Add follow-up question if provided
        /*if (data.followUpQuestion) {
          //setIsFollowUp(true);
          setTotalQuestionsAsked(prev => prev + 1); 
          updatedConversation.push({
            role: 'interviewer',
            content: data.followUpQuestion,
            questionId: `${currentQuestion.id}_followup`,
            timestamp: new Date()
          });
        }
        
        setConversation(updatedConversation);
        setCurrentAnswer('');

        // Move to next question if no follow-up
        if (!data.followUpQuestion && currentQuestionIndex < currentInterview.questions.length - 1) {
          const nextQuestion = currentInterview.questions[currentQuestionIndex + 1];
          setConversation(prev => [...prev, {
            role: 'interviewer',
            content: nextQuestion.question,
            questionId: nextQuestion.id,
            timestamp: new Date()
          }]);
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else if (!data.followUpQuestion) {
          // Interview completed
          handleCompleteInterview();
        }*/

        if (data.followUpQuestion) {
          // Follow-up generated — keep same question index, just show follow-up
          setIsFollowUp(true);
          updatedConversation.push({
            role: 'interviewer',
            content: data.followUpQuestion,
            questionId: `${currentQuestion.id}_followup`,
            timestamp: new Date()
          });
          setConversation(updatedConversation);
          setCurrentAnswer('');
        } else if (isFollowUp) {
          // Just answered a follow-up — now move to next main question
          setIsFollowUp(false);
          setConversation(updatedConversation);
          setCurrentAnswer('');
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex < currentInterview.questions.length) {
            const nextQuestion = currentInterview.questions[nextIndex];
            setConversation(prev => [...prev, {
              role: 'interviewer',
              content: nextQuestion.question,
              questionId: nextQuestion.id,
              timestamp: new Date()
            }]);
            setCurrentQuestionIndex(nextIndex);
            setTotalQuestionsAsked(nextIndex + 1);
          } else {
            handleCompleteInterview();
          }
        } else {
          // Normal answer — move to next main question
          setConversation(updatedConversation);
          setCurrentAnswer('');
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex < currentInterview.questions.length) {
            const nextQuestion = currentInterview.questions[nextIndex];
            setConversation(prev => [...prev, {
              role: 'interviewer',
              content: nextQuestion.question,
              questionId: nextQuestion.id,
              timestamp: new Date()
            }]);
            setCurrentQuestionIndex(nextIndex);
            setTotalQuestionsAsked(nextIndex + 1);
          } else {
            handleCompleteInterview();
          }
        }

        toast.success('Answer submitted successfully!');
      } else {
        toast.error(data.message || 'Failed to submit answer');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(apiUrl(`/api/interview/${currentInterview._id}/complete`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentInterview(data.interview);
        setIsInterviewCompleted(true);
        toast.success('Interview completed! Check your results.');
      } else {
        toast.error(data.message || 'Failed to complete interview');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'technical':
        return <Code className="h-6 w-6" />;
      case 'behavioral':
        return <Users className="h-6 w-6" />;
      case 'system-design':
        return <Target className="h-6 w-6" />;
      default:
        return <Brain className="h-6 w-6" />;
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-50"><Navbar user={user} /></div>;
  }

  if (!isInterviewStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Start Practice Interview</h1>
            <p className="text-lg text-gray-600">
              Configure your interview settings and begin practicing with our AI interviewer
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Interview Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Type</h3>
                <div className="space-y-3">
                  {[
                    { value: 'technical', label: 'Technical', icon: Code, desc: 'Coding and technical concepts' },
                    { value: 'behavioral', label: 'Behavioral', icon: Users, desc: 'Soft skills and cultural fit' },
                    { value: 'hr', label: 'HR', icon: Target, desc: 'Human resources and company culture' }
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setInterviewSettings(prev => ({ ...prev, type: type.value }))}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                          interviewSettings.type === type.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-primary-600" />
                          <div>
                            <p className="font-medium text-gray-900">{type.label}</p>
                            <p className="text-sm text-gray-600">{type.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub-Type
                    </label>
                    {isLoadingSubtypes ? (
                      <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <Brain className="h-4 w-4 text-primary-600 animate-pulse" />
                        <span className="text-sm text-gray-500">Generating relevant topics...</span>
                      </div>
                    ) : subtypes.length > 0 ? (
                      <select
                        value={interviewSettings.subType}
                        onChange={(e) => setInterviewSettings(prev => ({ ...prev, subType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {subtypes.map((subtype) => (
                          <option key={subtype} value={subtype.toLowerCase().replace(/[^a-z0-9]/g, '-')}>
                            {subtype}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-400">Enter a job title to see relevant topics</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={interviewSettings.difficulty}
                      onChange={(e) => setInterviewSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="input-field"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <select
                      value={interviewSettings.duration}
                      onChange={(e) => setInterviewSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="input-field"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={interviewSettings.adaptiveMode}
                        onChange={(e) => setInterviewSettings(prev => ({ ...prev, adaptiveMode: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Adaptive difficulty</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={interviewSettings.voiceMode}
                        onChange={(e) => setInterviewSettings(prev => ({ ...prev, voiceMode: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Voice mode (experimental)</span>
                    </label>

                    {/*<label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={interviewSettings.codingMode}
                        onChange={(e) => setInterviewSettings(prev => ({ ...prev, codingMode: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Include coding challenges</span>
                    </label>*/}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleStartInterview}
                disabled={isLoading}
                className="flex items-center space-x-2 px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-5 w-5" />
                <span>{isLoading ? 'Starting...' : 'Start Interview'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInterviewCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Interview Completed!</h1>
            <p className="text-lg text-gray-600">
              Great job! Here's your performance evaluation
            </p>
          </div>

          {currentInterview?.evaluation && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-primary-600 mb-2">
                  {currentInterview.evaluation.overallScore}%
                </div>
                <p className="text-gray-600">Overall Score</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths</h3>
                  <ul className="space-y-2">
                    {currentInterview.evaluation.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {currentInterview.evaluation.weaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-gray-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Tips</h3>
                <ul className="space-y-2">
                  {currentInterview.evaluation.improvementTips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => router.push(`/interview/${currentInterview._id}/review`)}
                  className="px-6 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                >
                  Review Interview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interview Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getInterviewTypeIcon(interviewSettings.type)}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {interviewSettings.type} Interview
                </h2>
                <p className="text-gray-600">
                  {/*Question {currentQuestionIndex + 1} of {currentInterview?.questions.length}*/}
                  {/*Question {totalQuestionsAsked} of {currentInterview?.questions.length + (totalQuestionsAsked - currentQuestionIndex - 1)}*/}
                  Question {totalQuestionsAsked} of {currentInterview?.questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className={`font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <button
                onClick={handleCompleteInterview}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'interviewer' 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'bg-gray-50 border-l-4 border-gray-500 ml-auto'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {message.role === 'interviewer' ? (
                      <Brain className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Users className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{message.content}</p>
                    {message.answerEvaluation && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-sm font-medium text-gray-700">
                          Score: {message.answerEvaluation.score}/100
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {message.answerEvaluation.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Input */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {interviewSettings.voiceMode && (
                <button
                  //onClick={() => setIsRecording(!isRecording)}
                  onClick={() => {
                    if (isRecording) {
                      recognitionRef.current?.stop();
                      setIsRecording(false);
                    } else {
                      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
                      if (!SpeechRecognition) {
                        toast.error('Voice input is not supported in this browser. Please use Chrome.');
                        return;
                      }

                      const recognition = new SpeechRecognition();
                      /*recognition.continuous = true;
                      recognition.interimResults = true;
                      recognition.lang = 'en-US';*/
                      
                      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                      recognition.continuous = !isSafari; // Safari doesn't support continuous mode
                      recognition.interimResults = !isSafari;
                      recognition.lang = 'en-US';

                      recognition.onresult = (event: any) => {
                        let transcript = '';
                        for (let i = 0; i < event.results.length; i++) {
                          transcript += event.results[i][0].transcript;
                        }
                        setCurrentAnswer(transcript);
                      };

                      /*recognition.onerror = (event: any) => {
                        console.error('Speech recognition error:', event.error);
                        toast.error('Voice recognition error. Please try again.');
                        setIsRecording(false);
                      };*/

                      recognition.onerror = (event: any) => {
                        console.error('Speech recognition error:', event.error);
                        if (event.error === 'aborted') return; // normal stop, not a real error
                        if (event.error === 'not-allowed') {
                          toast.error('Microphone access denied. Please allow microphone permissions.');
                        } else if (event.error === 'no-speech') {
                          toast.error('No speech detected. Please try again.');
                        } else {
                          toast.error('Voice recognition error. Please try again.');
                        }
                        setIsRecording(false);
                      };

                      recognition.onend = () => {
                        setIsRecording(false);
                      };

                      recognitionRef.current = recognition;
                      recognition.start();
                      setIsRecording(true);
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isRecording 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-600'}`} />
                  <span>{isRecording ? 'Recording...' : 'Voice Input'}</span>
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentAnswer('')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim() || isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Submitting...' : 'Submit Answer'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
