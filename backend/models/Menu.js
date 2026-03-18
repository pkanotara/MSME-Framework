const mongoose = require('mongoose');

// ─── Menu Category ─────────────────────────────────────────────────────────
const menuCategorySchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  description: String,
  imageUrl: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

menuCategorySchema.index({ restaurant: 1 });

// ─── Menu Item ──────────────────────────────────────────────────────────────
const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name: { type: String, required: true, trim: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  imageUrl: String,
  imagePublicId: String,
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: false },
  allergens: [String],
  sortOrder: { type: Number, default: 0 },
  // Stats
  totalOrdered: { type: Number, default: 0 },
}, { timestamps: true });

menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });

module.exports = {
  MenuCategory: mongoose.model('MenuCategory', menuCategorySchema),
  MenuItem: mongoose.model('MenuItem', menuItemSchema),
};
