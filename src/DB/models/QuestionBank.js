const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['technical', 'behavioral', 'system-design'],
    required: true,
  },
  subCategory: {
    type: String,
    enum: ['backend', 'frontend', 'dsa', 'general', 'architecture', 'scalability'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  experience: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'code', 'system-design'],
    default: 'text',
  },
  expectedAnswer: String,
  keyPoints: [String],
  followUps: [{
    question: String,
    trigger: String,
    condition: String, // when to ask this follow-up
  }],
  tags: [String],
  timeLimit: {
    type: Number, // in seconds
    default: 300, // 5 minutes
  },
  evaluationCriteria: {
    correctness: {
      weight: Number,
      description: String,
    },
    clarity: {
      weight: Number,
      description: String,
    },
    depth: {
      weight: Number,
      description: String,
    },
    structure: {
      weight: Number,
      description: String,
    },
  },
  usage: {
    timesAsked: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    lastUsed: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
questionBankSchema.index({ category: 1, subCategory: 1, difficulty: 1, experience: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
