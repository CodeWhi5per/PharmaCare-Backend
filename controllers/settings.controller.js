const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Activity = require('../models/Activity');

// @desc  Get user profile
// @route GET /api/settings/profile
exports.getProfile = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
};

// @desc  Update user profile
// @route PUT /api/settings/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone, role },
      { new: true, runValidators: true }
    );

    await Activity.create({
      action: 'Updated Profile',
      entity: 'User',
      entityId: user._id.toString(),
      entityName: user.name,
      performedBy: req.user._id,
    });

    res.status(200).json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    next(err);
  }
};

// @desc  Change password
// @route PUT /api/settings/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc  Update notification preferences
// @route PUT /api/settings/notifications
exports.updateNotifications = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: req.body },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Notification preferences updated', data: user });
  } catch (err) {
    next(err);
  }
};

// @desc  Update inventory thresholds
// @route PUT /api/settings/thresholds
exports.updateThresholds = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { inventoryThresholds: req.body },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Thresholds updated', data: user });
  } catch (err) {
    next(err);
  }
};

