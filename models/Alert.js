const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['critical', 'warning', 'info', 'success'],
      required: true,
    },
    category: {
      type: String,
      enum: ['Low Stock', 'Expiring Soon', 'Auto-Reorder', 'Supplier Response'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    medicine: { type: String, trim: true },
    currentStock: { type: Number },
    minStock: { type: Number },
    expiryDate: { type: Date },
    daysLeft: { type: Number },
    orderQty: { type: Number },
    orderId: { type: String, trim: true },
    supplier: { type: String, trim: true },
    resolved: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);

