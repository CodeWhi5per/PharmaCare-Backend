const Alert = require('../models/Alert');

/**
 * Checks a medicine and creates/updates alerts if needed.
 * @param {Object} medicine - Mongoose Medicine document
 * @param {number} expiryWarningDays - Days before expiry to trigger warning (default 30)
 */
const runAlertEngine = async (medicine, expiryWarningDays = 30) => {
  try {
    const daysToExpiry = Math.ceil(
      (new Date(medicine.expiry) - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Expiry alert
    if (daysToExpiry <= expiryWarningDays && daysToExpiry > 0) {
      const existing = await Alert.findOne({
        medicine: medicine.name,
        category: 'Expiring Soon',
        resolved: false,
        dismissed: false,
      });
      if (!existing) {
        await Alert.create({
          type: 'critical',
          category: 'Expiring Soon',
          title: `Medicine Expiring - ${medicine.name}`,
          message: `Will expire in ${daysToExpiry} days. ${medicine.stock} units in stock. Consider promotional pricing or return to supplier.`,
          medicine: medicine.name,
          expiryDate: medicine.expiry,
          daysLeft: daysToExpiry,
        });
      }
    }

    // Low stock / critical alerts
    if (medicine.stock < medicine.minStock) {
      const isCritical = medicine.stock < medicine.minStock * 0.5;
      const existing = await Alert.findOne({
        medicine: medicine.name,
        category: 'Low Stock',
        resolved: false,
        dismissed: false,
      });
      if (!existing) {
        await Alert.create({
          type: isCritical ? 'critical' : 'warning',
          category: 'Low Stock',
          title: `${isCritical ? 'Critical' : 'Low'} Stock Level - ${medicine.name}`,
          message: `Only ${medicine.stock} units remaining. Minimum threshold is ${medicine.minStock} units. ${isCritical ? 'Immediate reorder recommended.' : 'Auto-reorder can be triggered.'}`,
          medicine: medicine.name,
          currentStock: medicine.stock,
          minStock: medicine.minStock,
        });
      }
    }
  } catch (err) {
    console.error('Alert engine error:', err.message);
  }
};

module.exports = runAlertEngine;

