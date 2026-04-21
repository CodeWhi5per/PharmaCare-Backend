const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
    phone: { type: String, trim: true },
    notificationPreferences: {
      lowStockAlerts: { type: Boolean, default: true },
      expiryWarnings: { type: Boolean, default: true },
      autoReorderUpdates: { type: Boolean, default: true },
      supplierMessages: { type: Boolean, default: false },
      dailySummaryReports: { type: Boolean, default: true },
    },
    inventoryThresholds: {
      criticalStockPercent: { type: Number, default: 20 },
      lowStockPercent: { type: Number, default: 40 },
      expiryWarningDays: { type: Number, default: 30 },
      autoReorderBuffer: { type: Number, default: 150 },
    },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    otpPurpose: { type: String, enum: ['register', 'forgot_password'] },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

