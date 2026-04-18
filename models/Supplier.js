const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    activeOrders: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    responseTime: { type: String, trim: true },
    reliability: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);

