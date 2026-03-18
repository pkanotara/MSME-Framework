const mongoose = require('mongoose');

// ─── Broadcast Log ──────────────────────────────────────────────────────────
const broadcastLogSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  sentBy: { type: mongoose.Schema.Types.ObjectId }, // Admin or Owner
  sentByRole: { type: String, enum: ['super_admin', 'restaurant_owner'] },
  message: { type: String, required: true },
  mediaUrl: String,
  recipients: [String], // WA numbers
  totalSent: { type: Number, default: 0 },
  totalFailed: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  completedAt: Date,
}, { timestamps: true });

// ─── Activity Log ───────────────────────────────────────────────────────────
const activityLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId },
  actorRole: { type: String, enum: ['super_admin', 'restaurant_owner', 'staff', 'system'] },
  actorName: String,
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  action: { type: String, required: true },
  resourceType: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
}, { timestamps: true });

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ restaurant: 1, createdAt: -1 });

module.exports = {
  BroadcastLog: mongoose.model('BroadcastLog', broadcastLogSchema),
  ActivityLog: mongoose.model('ActivityLog', activityLogSchema),
};
