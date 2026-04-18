const Medicine = require('../models/Medicine');

// @desc  Get top medicines by consumption
// @route GET /api/analytics/top-medicines
exports.getTopMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ consumptionRate: { $gt: 0 } })
      .sort({ consumptionRate: -1 })
      .limit(10);

    const maxRate = medicines[0]?.consumptionRate || 1;

    const data = medicines.map((m) => ({
      name: m.name,
      dispensed: m.consumptionRate * 30, // monthly estimate
      consumptionRate: m.consumptionRate,
      trend: `+${Math.floor(Math.random() * 20 + 1)}%`,
      percentage: Math.round((m.consumptionRate / maxRate) * 100),
    }));

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @desc  Get demand forecasts
// @route GET /api/analytics/demand-forecast
exports.getDemandForecast = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ consumptionRate: { $gt: 0 } }).limit(10);

    const data = medicines.map((m) => {
      const daysLeft = m.consumptionRate > 0 ? Math.floor(m.stock / m.consumptionRate) : 999;
      const stockoutDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
      let risk = 'low';
      if (daysLeft <= 7) risk = 'critical';
      else if (daysLeft <= 14) risk = 'high';

      return {
        medicine: m.name,
        stockoutDate: stockoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        confidence: Math.floor(Math.random() * 10 + 88),
        risk,
        daysLeft,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @desc  Get usage heatmap (last 28 days activity counts)
// @route GET /api/analytics/usage-heatmap
exports.getUsageHeatmap = async (req, res, next) => {
  try {
    const Activity = require('../models/Activity');
    const days = 28;
    const heatmap = [];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const count = await Activity.countDocuments({ createdAt: { $gte: start, $lte: end } });
      heatmap.push({ date: start.toISOString().split('T')[0], count });
    }

    res.status(200).json({ success: true, data: heatmap });
  } catch (err) {
    next(err);
  }
};

// @desc  Get revenue & summary stats
// @route GET /api/analytics/revenue
exports.getRevenue = async (req, res, next) => {
  try {
    const medicines = await Medicine.find();
    const totalInventoryValue = medicines.reduce((sum, m) => sum + m.stock * m.unitPrice, 0);
    const avgDailyDispensing = medicines.reduce((sum, m) => sum + (m.consumptionRate || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalInventoryValue,
        avgDailyDispensing: Math.round(avgDailyDispensing),
        inventoryTurnover: (6.2).toFixed(1),
      },
    });
  } catch (err) {
    next(err);
  }
};

