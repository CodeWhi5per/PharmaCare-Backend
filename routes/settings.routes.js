const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  updateNotifications,
  updateThresholds,
} = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Profile routes - all authenticated users can access their own profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.put('/notifications', updateNotifications);

// Thresholds - admin and manager only
router.put('/thresholds', authorize('admin', 'manager'), updateThresholds);

module.exports = router;

