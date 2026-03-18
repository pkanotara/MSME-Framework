const express = require('express');
const router = express.Router();
const { handleEmbeddedSignupCallback, manualActivation } = require('../services/embeddedSignupService');
const Restaurant = require('../models/Restaurant');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/embedded-signup/callback
 * Meta redirects here after Embedded Signup completes
 */
router.get('/callback', async (req, res) => {
  const { code, state, error, error_reason, error_description } = req.query;

  logger.info('Embedded Signup callback received');

  if (error) {
    logger.error(`Meta OAuth error: ${error} - ${error_description}`);
    const reason = error_description || error_reason || error;
    return res.redirect(
      `${process.env.FRONTEND_URL}/onboard/error?reason=${encodeURIComponent(reason)}`
    );
  }

  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL}/onboard/error?reason=missing_params`);
  }

  try {
    const restaurantId = Buffer.from(state, 'base64').toString('utf8');
    const result = await handleEmbeddedSignupCallback(code, restaurantId);
    logger.info(`Signup complete: WABA=${result.wabaId}, Phone=${result.phoneNumberId}`);
    res.redirect(`${process.env.FRONTEND_URL}/onboard/success?restaurantId=${restaurantId}`);
  } catch (err) {
    logger.error('Embedded Signup callback error:', err.message);
    res.redirect(
      `${process.env.FRONTEND_URL}/onboard/error?reason=${encodeURIComponent(err.message)}`
    );
  }
});

/**
 * GET /api/embedded-signup/link/:restaurantId
 * PUBLIC - Generate Embedded Signup OAuth URL
 */
router.get('/link/:restaurantId', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const stateParam = Buffer.from(req.params.restaurantId).toString('base64');
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID,
      redirect_uri: process.env.EMBEDDED_SIGNUP_REDIRECT_URI,
      scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
      response_type: 'code',
      state: stateParam,
      config_id: process.env.META_CONFIG_ID,
    });

    const signupUrl = `https://www.facebook.com/dialog/oauth?${params.toString()}`;

    res.json({
      signupUrl,
      restaurantId: req.params.restaurantId,
      restaurantName: restaurant.name,
      targetBusinessNumber: restaurant.phone,
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/embedded-signup/status/:restaurantId
 * PUBLIC - Get WhatsApp config status
 */
router.get('/status/:restaurantId', async (req, res, next) => {
  try {
    const waConfig = await WhatsAppConfig.findOne({ restaurant: req.params.restaurantId });
    if (!waConfig) return res.status(404).json({ error: 'Config not found' });

    res.json({
      signupStatus: waConfig.signupStatus,
      botEnabled: waConfig.botEnabled,
      wabaId: waConfig.wabaId,
      phoneNumberId: waConfig.phoneNumberId,
      targetBusinessNumber: waConfig.targetBusinessNumber,
      configuredAt: waConfig.configuredAt,
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/embedded-signup/manual-activate/:restaurantId
 * ADMIN ONLY - Manually activate WhatsApp + auto-configure business profile
 */
router.post('/manual-activate/:restaurantId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { wabaId, phoneNumberId, accessToken } = req.body;
    if (!wabaId || !phoneNumberId) {
      return res.status(400).json({ error: 'wabaId and phoneNumberId are required' });
    }

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const waConfig = await manualActivation(req.params.restaurantId, {
      wabaId,
      phoneNumberId,
      accessToken,
    });

    res.json({
      message: `${restaurant.name} — WhatsApp activated and business profile configured!`,
      wabaId: waConfig.wabaId,
      phoneNumberId: waConfig.phoneNumberId,
      botEnabled: waConfig.botEnabled,
      status: waConfig.signupStatus,
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/embedded-signup/test-update/:restaurantId
 * TEST ONLY - Trigger profile update and see before/after
 * Usage: http://localhost:5000/api/embedded-signup/test-update/RESTAURANT_ID
 */
router.get('/test-update/:restaurantId', async (req, res) => {
  try {
    const { setupFullBusinessProfile, getWhatsAppBusinessProfile } = require('../services/whatsappProfileService');

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const waConfig = await WhatsAppConfig.findOne({ restaurant: req.params.restaurantId }).select('+accessToken');

    const phoneNumberId = (waConfig?.phoneNumberId && waConfig.phoneNumberId !== 'PENDING')
      ? waConfig.phoneNumberId
      : process.env.MAIN_PHONE_NUMBER_ID;

    const accessToken = waConfig?.accessToken || process.env.MAIN_ACCESS_TOKEN;

    logger.info(`Test profile update for: ${restaurant.name}`);
    logger.info(`Phone Number ID: ${phoneNumberId}`);

    // Get BEFORE
    let before = null;
    try {
      before = await getWhatsAppBusinessProfile(phoneNumberId, accessToken);
    } catch (e) {
      before = { error: e.response?.data || e.message };
    }

    // Update profile
    const results = await setupFullBusinessProfile(restaurant, phoneNumberId, accessToken);

    // Get AFTER
    let after = null;
    try {
      after = await getWhatsAppBusinessProfile(phoneNumberId, accessToken);
    } catch (e) {
      after = { error: e.response?.data || e.message };
    }

    res.json({
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        email: restaurant.email,
        categories: restaurant.foodCategories,
        hasLogo: !!restaurant.logoUrl,
        logoUrl: restaurant.logoUrl,
      },
      phoneNumberId,
      usingMainToken: !waConfig?.accessToken,
      before,
      updateResults: results,
      after,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

module.exports = router;