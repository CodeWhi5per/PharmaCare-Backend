const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Legacy
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// OTP-based registration
router.post('/send-registration-otp', sendRegistrationOtp);
router.post('/verify-registration-otp', verifyRegistrationOtp);

// Forgot password
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
