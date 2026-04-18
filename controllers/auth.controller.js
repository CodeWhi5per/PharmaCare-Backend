const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const Activity = require('../models/Activity');
const { generateOtp, sendOtpEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');

// Helper: save OTP to user doc
const saveOtp = async (user, purpose) => {
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  user.otpPurpose = purpose;
  await user.save();
  return otp;
};

// ─── REGISTRATION FLOW ────────────────────────────────────────────────────────

// @desc  Send OTP to new email before creating account
// @route POST /api/auth/send-registration-otp
exports.sendRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existing = await User.findOne({ email, isVerified: true });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Reuse or create a temporary unverified user record
    let tempUser = await User.findOne({ email, isVerified: false });
    if (!tempUser) {
      // Create a placeholder – password will be set after OTP verify
      tempUser = new User({ email, name: 'pending', password: 'placeholder', isVerified: false });
    }
    const otp = await saveOtp(tempUser, 'register');
    await sendOtpEmail(email, otp, 'register');

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    next(err);
  }
};

// @desc  Verify OTP then create the account
// @route POST /api/auth/verify-registration-otp
exports.verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { name, email, password, otp } = req.body;

    const tempUser = await User.findOne({ email, isVerified: false });
    if (!tempUser) {
      return res.status(400).json({ success: false, message: 'No pending registration found' });
    }
    if (tempUser.otpPurpose !== 'register' || tempUser.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (new Date() > tempUser.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    tempUser.name = name;
    tempUser.password = password;
    tempUser.isVerified = true;
    tempUser.otp = undefined;
    tempUser.otpExpiry = undefined;
    tempUser.otpPurpose = undefined;
    await tempUser.save();

    const token = generateToken(tempUser._id);

    await Activity.create({
      action: 'Registered',
      entity: 'User',
      entityId: tempUser._id.toString(),
      entityName: tempUser.name,
    });

    res.status(201).json({ success: true, message: 'Registration successful', token, user: tempUser });
  } catch (err) {
    next(err);
  }
};

// @desc  Legacy register (keeps backward compat, skips email verify)
// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email, isVerified: true });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, isVerified: true });
    const token = generateToken(user._id);
    await Activity.create({ action: 'Registered', entity: 'User', entityId: user._id.toString(), entityName: user.name });
    res.status(201).json({ success: true, message: 'Registration successful', token, user });
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

// @desc  Login user
// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    await Activity.create({ action: 'Logged In', entity: 'User', entityId: user._id.toString(), entityName: user.name });
    res.status(200).json({ success: true, message: 'Login successful', token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// ─── FORGOT PASSWORD FLOW ─────────────────────────────────────────────────────

// @desc  Send OTP for password reset
// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      return res.status(200).json({ success: true, message: 'If this email is registered, an OTP has been sent' });
    }
    const otp = await saveOtp(user, 'forgot_password');
    await sendOtpEmail(email, otp, 'forgot_password');
    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    next(err);
  }
};

// @desc  Verify forgot-password OTP
// @route POST /api/auth/verify-forgot-otp
exports.verifyForgotOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.otpPurpose !== 'forgot_password' || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    // Issue a short-lived reset token (reuse OTP field as reset token)
    const resetToken = generateOtp() + generateOtp(); // 12-char token
    user.otp = resetToken;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.otpPurpose = 'forgot_password';
    await user.save();
    res.status(200).json({ success: true, message: 'OTP verified', resetToken });
  } catch (err) {
    next(err);
  }
};

// @desc  Reset password using reset token
// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.otpPurpose !== 'forgot_password' || user.otp !== resetToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpPurpose = undefined;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────

// @desc  Get current user
// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};
