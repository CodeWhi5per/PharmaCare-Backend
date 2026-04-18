const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema(
  {
    supplier: { type: String, required: true, trim: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    message: { type: String, required: true },
    type: { type: String, enum: ['success', 'info', 'warning', 'error'], default: 'info' },
    direction: { type: String, enum: ['inbound', 'outbound'], default: 'inbound' },
    readAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Communication', communicationSchema);

