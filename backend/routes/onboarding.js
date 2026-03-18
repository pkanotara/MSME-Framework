const express = require('express');
const router = express.Router();
const OnboardingSession = require('../models/OnboardingSession');
const Restaurant = require('../models/Restaurant');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── Admin: View all onboarding sessions ─────────────────────────────────────
router.get('/sessions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await OnboardingSession.countDocuments(query);
    const sessions = await OnboardingSession.find(query)
      .populate('restaurant', 'name status')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ data: sessions, meta: { total, page: parseInt(page), totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// ─── Get session for a specific sender number (admin) ─────────────────────────
router.get('/sessions/:senderNumber', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const session = await OnboardingSession.findOne({ senderNumber: req.params.senderNumber })
      .populate('restaurant').populate('owner');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) { next(err); }
});

// ─── Public: Get restaurant onboarding status by restaurantId ─────────────────
// Used by the frontend onboarding page to show progress
router.get('/status/:restaurantId', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId)
      .populate('whatsappConfig', 'signupStatus botEnabled targetBusinessNumber configuredAt');
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    res.json({
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      status: restaurant.status,
      whatsapp: restaurant.whatsappConfig,
    });
  } catch (err) { next(err); }
});

module.exports = router;
