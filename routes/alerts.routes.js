const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  resolveAlert,
  dismissAlert,
} = require('../controllers/alerts.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// GET routes - all roles can view
router.get('/', getAlerts);

// POST routes - admin and manager only
router.post('/', authorize('admin', 'manager'), createAlert);

// PATCH routes - resolve (admin and manager), dismiss (all roles)
router.patch('/:id/resolve', authorize('admin', 'manager'), resolveAlert);
router.patch('/:id/dismiss', dismissAlert); // All authenticated users can dismiss

module.exports = router;

