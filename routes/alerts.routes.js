const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  resolveAlert,
  dismissAlert,
} = require('../controllers/alerts.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/').get(getAlerts).post(createAlert);
router.patch('/:id/resolve', resolveAlert);
router.patch('/:id/dismiss', dismissAlert);

module.exports = router;

