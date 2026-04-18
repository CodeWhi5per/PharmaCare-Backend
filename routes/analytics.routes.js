const express = require('express');
const router = express.Router();
const {
  getTopMedicines,
  getDemandForecast,
  getUsageHeatmap,
  getRevenue,
} = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/top-medicines', getTopMedicines);
router.get('/demand-forecast', getDemandForecast);
router.get('/usage-heatmap', getUsageHeatmap);
router.get('/revenue', getRevenue);

module.exports = router;

