const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  whatsappNumber: { type: String, required: true },
  name: String,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderAt: Date,
  isBlocked: { type: Boolean, default: false },
  // Bot session state for ordering flow
  botSession: {
    step: { type: String, default: 'idle' },
    cart: [{
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
    }],
    lastActivity: Date,
  },
}, { timestamps: true });

customerSchema.index({ restaurant: 1, whatsappNumber: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
