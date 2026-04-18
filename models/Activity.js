const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. 'Added', 'Updated', 'Deleted', 'Reordered'
    entity: { type: String, required: true }, // 'Medicine', 'Supplier', 'Alert', 'Order'
    entityId: { type: String },
    entityName: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meta: { type: Object }, // extra data
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);

