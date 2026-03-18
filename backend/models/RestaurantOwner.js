const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const restaurantOwnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 8, select: false },
  whatsappNumber: { type: String, required: true }, // owner's personal WA number
  role: { type: String, enum: ['restaurant_owner'], default: 'restaurant_owner' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: Date,
  refreshToken: { type: String, select: false },
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Auto-generated credentials sent via WhatsApp after onboarding
  tempPassword: { type: String, select: false },
}, { timestamps: true });

restaurantOwnerSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

restaurantOwnerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

restaurantOwnerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.tempPassword;
  return obj;
};

module.exports = mongoose.model('RestaurantOwner', restaurantOwnerSchema);
