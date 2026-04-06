const mongoose = require('mongoose');

const onboardingSessionSchema = new mongoose.Schema({
  // The WhatsApp number of the person messaging our main bot
  senderNumber: { type: String, required: true },
  step: {
    type: String,
    enum: [
      'start',
      'owner_name',
      'owner_name_confirm', // ✅ ADDED
      'restaurant_name',
      'restaurant_whatsapp_number',
      'email',
      'address',
      'description',
      'working_hours',
      'food_categories',
      'menu_intro',
      'menu_item_name',
      'menu_item_description',
      'menu_item_price',
      'menu_item_category',
      'menu_item_image',
      'menu_item_more',
      'logo',
      'review',
      'completed',
    ],
    default: 'start',
  },
  // Collected data
  data: {
    ownerName: String,
    waProfileName: String, // ✅ ADDED (used for owner_name_confirm step)
    restaurantName: String,
    targetBusinessNumber: String,
    email: String,
    address: String,
    description: String,
    workingHours: String, // raw text, parsed later
    foodCategories: [String],
    logoUrl: String,
    menuItems: [{
      name: String,
      description: String,
      price: Number,
      category: String,
      imageUrl: String,
    }],
  },
  // Temp buffer for current menu item being added
  currentMenuItem: {
    name: String,
    description: String,
    price: Number,
    category: String,
    imageUrl: String,
  },
  // Link to created restaurant after session completes
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantOwner' },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
  },
  completedAt: Date,
  lastMessageAt: { type: Date, default: Date.now },
  // Onboarding link sent to owner
  onboardingLink: String,
  onboardingLinkSentAt: Date,
}, { timestamps: true });

onboardingSessionSchema.index({ senderNumber: 1 });
onboardingSessionSchema.index({ status: 1 });
onboardingSessionSchema.index({ lastMessageAt: 1 });

module.exports = mongoose.model('OnboardingSession', onboardingSessionSchema);