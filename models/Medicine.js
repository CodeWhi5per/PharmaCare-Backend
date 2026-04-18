const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, required: true, min: 0, default: 0 },
    expiry: { type: Date, required: true },
    supplier: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    unitPrice: { type: Number, min: 0, default: 0 },
    consumption: { type: String, trim: true }, // e.g. "12/day"
    consumptionRate: { type: Number, default: 0 }, // units per day (numeric)
    status: {
      type: String,
      enum: ['healthy', 'low', 'critical', 'expiring'],
      default: 'healthy',
    },
  },
  { timestamps: true }
);

// Auto-compute status before saving
medicineSchema.pre('save', function (next) {
  const daysToExpiry = Math.ceil((new Date(this.expiry) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysToExpiry <= 30) {
    this.status = 'expiring';
  } else if (this.stock < this.minStock * 0.5) {
    this.status = 'critical';
  } else if (this.stock < this.minStock) {
    this.status = 'low';
  } else {
    this.status = 'healthy';
  }
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);

