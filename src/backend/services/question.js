const express = require('express');
const QuestionBank = require('../../DB/models/QuestionBank');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get questions from bank
// @route   GET /api/questions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      category, 
      subCategory, 
      difficulty, 
      experience, 
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (difficulty) filter.difficulty = difficulty;
    if (experience) filter.experience = experience;

    const questions = await QuestionBank.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuestionBank.countDocuments(filter);

    res.status(200).json({
      success: true,
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get questions'
    });
  }
});

// @desc    Add question to bank
// @route   POST /api/questions
// @access  Private (Admin/Recruiter only)
router.post('/', protect, authorize('recruiter'), async (req, res) => {
  try {
    const question = await QuestionBank.create(req.body);

    res.status(201).json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add question'
    });
  }
});

// @desc    Update question in bank
// @route   PUT /api/questions/:id
// @access  Private (Admin/Recruiter only)
router.put('/:id', protect, authorize('recruiter'), async (req, res) => {
  try {
    const question = await QuestionBank.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
});

// @desc    Delete question from bank
// @route   DELETE /api/questions/:id
// @access  Private (Admin/Recruiter only)
router.delete('/:id', protect, authorize('recruiter'), async (req, res) => {
  try {
    const question = await QuestionBank.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
});

// @desc    Get question categories
// @route   GET /api/questions/categories
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await QuestionBank.distinct('category');
    const subCategories = await QuestionBank.distinct('subCategory');
    const difficulties = await QuestionBank.distinct('difficulty');
    const experiences = await QuestionBank.distinct('experience');

    res.status(200).json({
      success: true,
      categories,
      subCategories,
      difficulties,
      experiences
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

// @desc    Get random questions
// @route   GET /api/questions/random
// @access  Private
router.get('/random', protect, async (req, res) => {
  try {
    const { 
      category, 
      subCategory, 
      difficulty, 
      experience, 
      count = 5 
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (difficulty) filter.difficulty = difficulty;
    if (experience) filter.experience = experience;

    const questions = await QuestionBank.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(count) } }
    ]);

    res.status(200).json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get random questions'
    });
  }
});

module.exports = router;
