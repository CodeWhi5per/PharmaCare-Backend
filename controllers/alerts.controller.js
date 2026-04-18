const Alert = require('../models/Alert');
const Activity = require('../models/Activity');

// @desc  Get all alerts (with filters)
// @route GET /api/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const { filter, type, resolved, dismissed } = req.query;
    const query = { dismissed: false };

    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (type) query.type = type;

    if (filter && filter !== 'All') {
      if (filter === 'Critical') query.type = 'critical';
      else if (filter === 'Low Stock') query.category = 'Low Stock';
      else if (filter === 'Expiring Soon') query.category = 'Expiring Soon';
      else if (filter === 'Auto-Reorder') query.category = 'Auto-Reorder';
    }

    const alerts = await Alert.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

// @desc  Create an alert
// @route POST /api/alerts
exports.createAlert = async (req, res, next) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
};

// @desc  Resolve an alert
// @route PATCH /api/alerts/:id/resolve
exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    await Activity.create({
      action: 'Resolved Alert',
      entity: 'Alert',
      entityId: alert._id.toString(),
      entityName: alert.title,
      performedBy: req.user._id,
    });

    res.status(200).json({ success: true, message: 'Alert resolved', data: alert });
  } catch (err) {
    next(err);
  }
};

// @desc  Dismiss an alert
// @route PATCH /api/alerts/:id/dismiss
exports.dismissAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { dismissed: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    res.status(200).json({ success: true, message: 'Alert dismissed', data: alert });
  } catch (err) {
    next(err);
  }
};

