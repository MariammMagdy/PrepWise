const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../../DB/models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `resume_${Date.now()}_${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    /*const {
      name,
      profile: {
        experience,
        jobTitle,
        company,
        skills,
        avatar
      }
    } = req.body;*/
    const { name, profile = {}, preferences = {} } = req.body;
    const { experience, jobTitle, company, skills, avatar } = profile;

    const updateData = {};
    if (name) updateData.name = name;
    if (experience !== undefined) updateData['profile.experience'] = experience;
    if (jobTitle !== undefined) updateData['profile.jobTitle'] = jobTitle;
    if (company !== undefined) updateData['profile.company'] = company;
    if (skills !== undefined) updateData['profile.skills'] = skills;
    if (avatar !== undefined) updateData['profile.avatar'] = avatar;
    if (preferences.difficulty !== undefined) updateData['preferences.difficulty'] = preferences.difficulty;

    /*const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');*/


    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        'profile.experience': experience,
        'profile.jobTitle': jobTitle,
        'profile.company': company,
        'profile.skills': skills,
        'profile.avatar': avatar,
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @desc    Upload resume
// @route   POST /api/user/resume
// @access  Private
router.post('/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const resumeUrl = `/uploads/${req.file.filename}`;
    
    await User.findByIdAndUpdate(
      req.user._id,
      { 'profile.resume': resumeUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      resumeUrl
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/user/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const Interview = require('../../DB/models/Interview');
    
    const userId = req.user._id;
    
    // Get interview statistics
    const totalInterviews = await Interview.countDocuments({ user: userId });
    const completedInterviews = await Interview.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });
    
    // Get average scores
    const completedInterviewsData = await Interview.find({ 
      user: userId, 
      status: 'completed',
      'evaluation.overallScore': { $exists: true }
    }).select('evaluation.overallScore type difficulty');
    
    const averageScore = completedInterviewsData.length > 0
      ? Math.round(
          completedInterviewsData.reduce((sum, interview) => 
            sum + interview.evaluation.overallScore, 0
          ) / completedInterviewsData.length
        )
      : 0;
    
    // Get type distribution
    const typeStats = await Interview.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Get difficulty distribution
    const difficultyStats = await Interview.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    
    // Get recent performance trend
    const recentInterviews = await Interview.find({ 
      user: userId, 
      status: 'completed' 
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('evaluation.overallScore createdAt');
    
    const performanceTrend = recentInterviews.map(interview => ({
      date: interview.createdAt,
      score: interview.evaluation.overallScore
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalInterviews,
        completedInterviews,
        completionRate: totalInterviews > 0 
          ? Math.round((completedInterviews / totalInterviews) * 100) 
          : 0,
        averageScore,
        typeStats: typeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        difficultyStats: difficultyStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        performanceTrend
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

// @desc    Save interview to saved list
// @route   POST /api/user/save-interview
// @access  Private
router.post('/save-interview', protect, async (req, res) => {
  try {
    const { interviewId } = req.body;
    
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedInterviews: interviewId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Interview saved successfully'
    });
  } catch (error) {
    console.error('Save interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save interview'
    });
  }
});

// @desc    Remove interview from saved list
// @route   DELETE /api/user/save-interview/:interviewId
// @access  Private
router.delete('/save-interview/:interviewId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedInterviews: req.params.interviewId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Interview removed from saved list'
    });
  } catch (error) {
    console.error('Remove saved interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved interview'
    });
  }
});

// @desc    Get saved interviews
// @route   GET /api/user/saved-interviews
// @access  Private
router.get('/saved-interviews', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedInterviews',
        select: 'type difficulty status evaluation createdAt metadata'
      });

    res.status(200).json({
      success: true,
      savedInterviews: user.savedInterviews
    });
  } catch (error) {
    console.error('Get saved interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved interviews'
    });
  }
});

module.exports = router;
