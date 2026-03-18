const mongoose = require('mongoose');

const whatsappConfigSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
  // The phone number the restaurant owner wants to use as their WA Business number
  targetBusinessNumber: { type: String, required: true },
  normalizedNumber: String, // e.g. 919876543210
  // Populated after Embedded Signup completes
  wabaId: String,            // WhatsApp Business Account ID
  phoneNumberId: String,     // Phone Number ID (used in API calls)
  businessAccountId: String, // Meta Business Account ID
  accessToken: { type: String, select: false }, // Long-lived token
  // Webhook
  webhookSubscribed: { type: Boolean, default: false },
  // Status
  signupStatus: {
    type: String,
    enum: ['pending', 'signup_started', 'signup_completed', 'configured', 'failed'],
    default: 'pending',
  },
  signupCompletedAt: Date,
  configuredAt: Date,
  // Bot state
  botEnabled: { type: Boolean, default: false },
  botInitializedAt: Date,
  // Error tracking
  lastError: String,
  errorAt: Date,
}, { timestamps: true });

whatsappConfigSchema.index({ targetBusinessNumber: 1 });
whatsappConfigSchema.index({ phoneNumberId: 1 });

module.exports = mongoose.model('WhatsAppConfig', whatsappConfigSchema);
