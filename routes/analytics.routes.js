const express = require('express');
const router = express.Router();
const {
  getTopMedicines,
  getDemandForecast,
  getUsageHeatmap,
  getRevenue,
} = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Analytics routes - admin and manager only
router.get('/top-medicines', authorize('admin', 'manager'), getTopMedicines);
router.get('/demand-forecast', authorize('admin', 'manager'), getDemandForecast);
router.get('/usage-heatmap', authorize('admin', 'manager'), getUsageHeatmap);
router.get('/revenue', authorize('admin', 'manager'), getRevenue);

module.exports = router;

