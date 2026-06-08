const express = require('express');
const Interview = require('../../DB/models/Interview');
const User = require('../../DB/models/User');
const { protect } = require('../middleware/auth');
const axios = require('axios');
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const router = express.Router();

// @desc    Create new interview
// @route   POST /api/interview/create
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const { type, subType, difficulty, settings } = req.body;
    
    // Generate questions using AI service
    const questionsResponse = await axios.post(`${BASE_URL}/api/ai/generate-questions`, {
      type,
      subType,
      difficulty,
      experience: req.user.profile.experience,
      jobTitle: req.user.profile.jobTitle,
      skills: req.user.profile.skills
    });

    const interview = await Interview.create({
      user: req.user._id,
      type,
      subType,
      difficulty,
      settings: {
        duration: settings?.duration || 30,
        adaptiveMode: settings?.adaptiveMode !== false,
        voiceMode: settings?.voiceMode || false,
        codingMode: settings?.codingMode || false,
      },
      questions: questionsResponse.data.questions,
      metadata: {
        startTime: new Date(),
        questionCount: questionsResponse.data.questions.length,
      }
    });

    // Add interview to user's history
    await User.findByIdAndUpdate(req.user._id, {
      $push: { interviewHistory: interview._id }
    });

    res.status(201).json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create interview'
    });
  }
});

// @desc    Get interview by ID
// @route   GET /api/interview/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('user', 'name email profile');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user owns this interview
    if (interview.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }

    res.status(200).json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview'
    });
  }
});

// @desc    Get user interviews
// @route   GET /api/interview
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-conversation'); // Exclude conversation for list view

    const total = await Interview.countDocuments(filter);

    res.status(200).json({
      success: true,
      interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interviews'
    });
  }
});

// @desc    Submit answer
// @route   POST /api/interview/:id/answer
// @access  Private
router.post('/:id/answer', protect, async (req, res) => {
  try {
    const { questionId, answer, timeTaken } = req.body;
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user owns this interview
    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }

    // Find the question
    const question = interview.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Evaluate answer using AI
    const evaluationResponse = await axios.post(`${BASE_URL}/api/ai/evaluate-answer`, {
      question: question.question,
      answer,
      type: interview.type,
      difficulty: question.difficulty
    });

    // Behavioral analysis
    const behavioralResponse = await axios.post(`${BASE_URL}/api/ai/behavioral-analysis`, {
      answer,
      timeTaken,
      wordCount: answer.split(' ').length
    });

    // Add to conversation
    /*const conversationEntry = {
      role: 'candidate',
      content: answer,
      questionId,
      timestamp: new Date(),
      answerEvaluation: evaluationResponse.data.evaluation,
      behavioralAnalysis: behavioralResponse.data.analysis
    };

    interview.conversation.push(conversationEntry);*/

    const questionAlreadySaved = interview.conversation.some(
      c => c.role === 'interviewer' && c.questionId === questionId && !c.questionId.includes('_followup')
    );

    if (!questionAlreadySaved) {
      interview.conversation.push({
        role: 'interviewer',
        content: question.question,
        questionId,
        timestamp: new Date(),
      });
    }

    // Save the candidate's answer
    interview.conversation.push({
      role: 'candidate',
      content: answer,
      questionId,
      timestamp: new Date(),
      answerEvaluation: evaluationResponse.data.evaluation,
      behavioralAnalysis: behavioralResponse.data.analysis
    });

    // Update metadata
    if (!interview.metadata.startTime) {
      interview.metadata.startTime = new Date();
      interview.status = 'in-progress';
    }

    // Generate follow-up question if adaptive mode is on
    let followUpQuestion = null;
    if (interview.settings.adaptiveMode && evaluationResponse.data.evaluation.score < 70) {
      const followUpResponse = await axios.post(`${BASE_URL}/api/ai/follow-up`, {
        originalQuestion: question.question,
        answer,
        conversationHistory: interview.conversation
      });

      followUpQuestion = {
        role: 'interviewer',
        content: followUpResponse.data.followUp,
        questionId: `${questionId}_followup`,
        timestamp: new Date()
      };

      interview.conversation.push(followUpQuestion);
    }

    await interview.save();

    res.status(200).json({
      success: true,
      evaluation: evaluationResponse.data.evaluation,
      behavioralAnalysis: behavioralResponse.data.analysis,
      followUpQuestion: followUpQuestion?.content
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer'
    });
  }
});

// @desc    Complete interview
// @route   POST /api/interview/:id/complete
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user owns this interview
    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }

    // Calculate overall evaluation
    /*const evaluations = interview.conversation
      .filter(c => c.answerEvaluation)
      .map(c => c.answerEvaluation);

    if (evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No answers to evaluate'
      });
    }

    const overallScore = Math.round(
      evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length
    );*/

    const evaluations = interview.conversation
      .filter(c => c.answerEvaluation)
      .map(c => c.answerEvaluation);

    const validScores = evaluations
      .map(e => Number(e?.score))
      .filter(score => !isNaN(score) && score !== null && score !== undefined);

    const overallScore = validScores.length > 0
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : 0;

    // Generate comprehensive report using AI
    /*const reportPrompt = `Generate a comprehensive interview report based on the following data:
    
    Interview Type: ${interview.type}
    Difficulty: ${interview.difficulty}
    Overall Score: ${overallScore}
    Evaluations: ${JSON.stringify(evaluations)}
    
    Provide in JSON format:
    {
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "improvementTips": ["tip1", "tip2"],
      "suggestedTopics": ["topic1", "topic2"],
      "detailedFeedback": {
        "technicalSkills": {"score": 85, "feedback": "feedback"},
        "communication": {"score": 80, "feedback": "feedback"},
        "problemSolving": {"score": 75, "feedback": "feedback"},
        "behavioral": {"score": 90, "feedback": "feedback"}
      }
    }`;

    const completion = await axios.post('http://localhost:3001/api/ai/evaluate-answer', {
      question: "Generate comprehensive interview report",
      answer: reportPrompt,
      type: "report-generation",
      difficulty: "medium"
    });

    const reportData = completion.data.evaluation.feedback || '{}';
    const report = JSON.parse(reportData);*/

    const reportResponse = await axios.post(`${BASE_URL}/api/ai/generate-report`, {
      interviewType: interview.type,
      difficulty: interview.difficulty,
      overallScore,
      evaluations
    });
    const report = reportResponse.data.report;

    // Update interview
    interview.status = 'completed';
    interview.metadata.endTime = new Date();
    interview.metadata.duration = Math.round(
      (interview.metadata.endTime - interview.metadata.startTime) / 1000
    );
    interview.evaluation = {
      overallScore,
      strengths: report.strengths || [],
      weaknesses: report.weaknesses || [],
      improvementTips: report.improvementTips || [],
      suggestedTopics: report.suggestedTopics || [],
      detailedFeedback: report.detailedFeedback || {}
    };

    await interview.save();

    res.status(200).json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete interview'
    });
  }
});

// @desc    Delete interview
// @route   DELETE /api/interview/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user owns this interview
    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this interview'
      });
    }

    await Interview.findByIdAndDelete(req.params.id);

    // Remove from user's history
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { interviewHistory: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview'
    });
  }
});

module.exports = router;
