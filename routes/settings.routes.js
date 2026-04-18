const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  updateNotifications,
  updateThresholds,
} = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.put('/notifications', updateNotifications);
router.put('/thresholds', updateThresholds);

module.exports = router;

