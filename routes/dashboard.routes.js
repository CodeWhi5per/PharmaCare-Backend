const express = require('express');
const router = express.Router();
const {
  getStats,
  getConsumptionChart,
  getStockPrediction,
  getRecentActivity,
} = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/stats', getStats);
router.get('/consumption-chart', getConsumptionChart);
router.get('/stock-prediction', getStockPrediction);
router.get('/recent-activity', getRecentActivity);

module.exports = router;

