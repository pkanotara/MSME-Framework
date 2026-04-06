const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  whatsappNumber: { type: String, required: true },
  name: String,
  address: String, // saved delivery address
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderAt: Date,
  isBlocked: { type: Boolean, default: false },
  botSession: {
    step: { type: String, default: 'idle' },
    cart: [{
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
    }],
    // Item browsing state
    currentCategoryId: String,
    currentCategoryName: String,
    itemsList: [String],
    currentItemIndex: { type: Number, default: 0 },
    // Checkout state
    deliveryAddress: String,
    paymentMethod: String,
    // Last order tracking
    lastOrderId: String,
    lastOrderNumber: String,
    lastActivity: Date,
  },
}, { timestamps: true });

customerSchema.index({ restaurant: 1, whatsappNumber: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);