const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'hr'],
    required: true,
  },
  subType: {
    type: String,
    required: true
  },
  /*subType: {
    type: String,
    enum: ['backend', 'frontend', 'dsa', 'general', 'leadership', 'teamwork', 'architecture', 'scalability' , 'performance'],
  },*/
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'paused'],
    default: 'pending',
  },
  settings: {
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    adaptiveMode: {
      type: Boolean,
      default: true,
    },
    voiceMode: {
      type: Boolean,
      default: false,
    },
    codingMode: {
      type: Boolean,
      default: false,
    },
  },
  questions: [{
    id: String,
    question: String,
    type: {
      type: String,
      enum: ['text', 'code', 'system-design'],
    },
    difficulty: String,
    category: String,
    followUp: [{
      question: String,
      trigger: String, // what triggers this follow-up
    }],
    timeLimit: Number, // in seconds
  }],
  conversation: [{
    role: {
      type: String,
      enum: ['interviewer', 'candidate'],
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    questionId: String,
    answerEvaluation: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      correctness: Number,
      clarity: Number,
      depth: Number,
      structure: Number,
      feedback: String,
      strengths: [String],
      weaknesses: [String],
    },
    behavioralAnalysis: {
      confidence: Number,
      organization: Number,
      conciseness: Number,
      communication: Number,
    },
  }],
  evaluation: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    strengths: [String],
    weaknesses: [String],
    improvementTips: [String],
    suggestedTopics: [String],
    detailedFeedback: {
      technicalSkills: {
        score: Number,
        feedback: String,
      },
      communication: {
        score: Number,
        feedback: String,
      },
      problemSolving: {
        score: Number,
        feedback: String,
      },
      behavioral: {
        score: Number,
        feedback: String,
      },
    },
  },
  metadata: {
    startTime: Date,
    endTime: Date,
    duration: Number, // actual duration in seconds
    questionCount: Number,
    averageResponseTime: Number,
    difficultyProgression: [String], // tracks how difficulty changed
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Interview', interviewSchema);
