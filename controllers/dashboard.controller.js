const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');
const Activity = require('../models/Activity');

// @desc  Get dashboard stats
// @route GET /api/dashboard/stats
exports.getStats = async (req, res, next) => {
  try {
    const totalMedicines = await Medicine.countDocuments();
    const lowStockItems = await Medicine.countDocuments({ status: { $in: ['low', 'critical'] } });
    const expiringSoon = await Medicine.countDocuments({ status: 'expiring' });
    const autoOrders = await Alert.countDocuments({ category: 'Auto-Reorder', resolved: false });

    res.status(200).json({
      success: true,
      data: {
        totalMedicines,
        lowStockItems,
        expiringSoon,
        autoOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get consumption chart data (last 7 days per category)
// @route GET /api/dashboard/consumption-chart
exports.getConsumptionChart = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({}, 'name category consumptionRate stock');

    // Group by category and sum consumption rates
    const categoryMap = {};
    medicines.forEach((m) => {
      const cat = m.category;
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += m.consumptionRate || 0;
    });

    // Build last 7 days labels
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    // Build datasets per top category
    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const datasets = topCategories.map((cat) => ({
      label: cat,
      data: days.map(() => Math.floor(Math.random() * 50 + 10)), // simulate daily variation
    }));

    res.status(200).json({ success: true, data: { labels: days, datasets } });
  } catch (err) {
    next(err);
  }
};

// @desc  Get stock prediction chart data
// @route GET /api/dashboard/stock-prediction
exports.getStockPrediction = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ consumptionRate: { $gt: 0 } })
      .sort('stock')
      .limit(5);

    const predictions = medicines.map((m) => {
      const daysLeft = m.consumptionRate > 0 ? Math.floor(m.stock / m.consumptionRate) : 999;
      return {
        name: m.name,
        currentStock: m.stock,
        daysLeft,
        predictedStockout: new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toLocaleDateString(),
        consumptionRate: m.consumptionRate,
      };
    });

    res.status(200).json({ success: true, data: predictions });
  } catch (err) {
    next(err);
  }
};

// @desc  Get recent activity feed
// @route GET /api/dashboard/recent-activity
exports.getRecentActivity = async (req, res, next) => {
  try {
    const activities = await Activity.find({
      // Exclude user auth events
      $nor: [
        { entity: 'User' },
        { action: 'Logged In' },
        { action: 'Registered' },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('performedBy', 'name');

    res.status(200).json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
};

