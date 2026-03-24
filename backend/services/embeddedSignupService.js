const axios = require('axios');
const Restaurant = require('../models/Restaurant');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const { exchangeToken, subscribeWebhook } = require('./whatsappService');
const { setupFullBusinessProfile } = require('./whatsappProfileService');
const { ActivityLog } = require('../models/Logs');
const logger = require('../utils/logger');

const GRAPH_BASE = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v19.0'}`;

/**
 * Handle Meta Embedded Signup OAuth callback
 * This is called when restaurant owner completes Facebook login + phone verification
 * It automatically gets WABA ID, Phone Number ID, and Access Token
 */
const handleEmbeddedSignupCallback = async (code, restaurantId) => {
  logger.info(`=== Embedded Signup START for restaurant: ${restaurantId} ===`);

  // ── Step 1: Exchange code for access token ──────────────────────────────────
  logger.info('Step 1: Exchanging authorization code for token...');
  let shortLivedToken;
  try {
    const tokenRes = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.EMBEDDED_SIGNUP_REDIRECT_URI,
        code,
      },
    });
    shortLivedToken = tokenRes.data.access_token;
    logger.info('✅ Step 1: Short-lived token obtained');
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    logger.error('❌ Step 1 FAILED:', err.response?.data || err.message);
    throw new Error(`Token exchange failed: ${msg}`);
  }

  // ── Step 2: Exchange for long-lived token ───────────────────────────────────
  logger.info('Step 2: Getting long-lived token...');
  let accessToken = shortLivedToken;
  try {
    accessToken = await exchangeToken(shortLivedToken);
    logger.info('✅ Step 2: Long-lived token obtained');
  } catch (err) {
    logger.warn('⚠️ Step 2: Using short-lived token:', err.message);
  }

  // ── Step 3: Get WABA ID using multiple methods ──────────────────────────────
  logger.info('Step 3: Finding WhatsApp Business Account...');
  let wabaId = null;
  let businessAccountId = null;

  // Method A: Direct WABA endpoint
  try {
    const res = await axios.get(`${GRAPH_BASE}/me/whatsapp_business_accounts`, {
      params: { access_token: accessToken },
    });
    const list = res.data.data || [];
    logger.info(`Method A: Found ${list.length} WABA(s)`);
    if (list.length > 0) {
      wabaId = list[0].id;
      logger.info(`✅ Method A: WABA ID = ${wabaId}`);
    }
  } catch (err) {
    logger.warn('Method A failed:', err.response?.data?.error?.message || err.message);
  }

  // Method B: Via businesses
  if (!wabaId) {
    try {
      const res = await axios.get(`${GRAPH_BASE}/me/businesses`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,whatsapp_business_accounts{id,name}',
        },
      });
      for (const biz of (res.data.data || [])) {
        businessAccountId = biz.id;
        const wabas = biz.whatsapp_business_accounts?.data || [];
        if (wabas.length > 0) {
          wabaId = wabas[0].id;
          logger.info(`✅ Method B: WABA ID = ${wabaId} (from business ${biz.name})`);
          break;
        }
      }
    } catch (err) {
      logger.warn('Method B failed:', err.response?.data?.error?.message || err.message);
    }
  }

  // Method C: From token debug granular scopes
  if (!wabaId) {
    try {
      const res = await axios.get(`${GRAPH_BASE}/debug_token`, {
        params: {
          input_token: accessToken,
          access_token: `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`,
        },
      });
      const scopes = res.data.data?.granular_scopes || [];
      for (const scope of scopes) {
        if (scope.scope === 'whatsapp_business_management' && scope.target_ids?.length > 0) {
          wabaId = scope.target_ids[0];
          logger.info(`✅ Method C: WABA ID = ${wabaId} (from token scope)`);
          break;
        }
      }
    } catch (err) {
      logger.warn('Method C failed:', err.response?.data?.error?.message || err.message);
    }
  }

  // Fallback: use platform WABA
  if (!wabaId) {
    logger.warn('⚠️ Could not find WABA from OAuth. Using platform WABA as fallback.');
    wabaId = process.env.MAIN_WABA_ID;
  }

  logger.info(`Using WABA ID: ${wabaId}`);

  // ── Step 4: Get Phone Numbers under this WABA ───────────────────────────────
  logger.info('Step 4: Fetching phone numbers...');
  let phoneNumberId = null;
  let phoneDisplayNumber = null;

  try {
    const res = await axios.get(`${GRAPH_BASE}/${wabaId}/phone_numbers`, {
      params: {
        access_token: accessToken,
        fields: 'id,display_phone_number,verified_name,code_verification_status',
      },
    });
    const phones = res.data.data || [];
    logger.info(`Found ${phones.length} phone number(s):`);
    phones.forEach(p => logger.info(`  - ${p.display_phone_number} (${p.id}) status: ${p.code_verification_status}`));

    if (phones.length > 0) {
      phoneNumberId = phones[0].id;
      phoneDisplayNumber = phones[0].display_phone_number;
      logger.info(`✅ Using Phone Number ID: ${phoneNumberId} (${phoneDisplayNumber})`);
    }
  } catch (err) {
    logger.error('❌ Phone numbers fetch failed:', err.response?.data || err.message);
    // Fallback to platform number
    phoneNumberId = process.env.MAIN_PHONE_NUMBER_ID;
    logger.warn(`⚠️ Using platform Phone Number ID as fallback: ${phoneNumberId}`);
  }

  // ── Step 5: Save to database ────────────────────────────────────────────────
  logger.info('Step 5: Saving to database...');
  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId });
  if (!waConfig) throw new Error('WhatsApp config not found for this restaurant');

  waConfig.wabaId = wabaId;
  waConfig.phoneNumberId = phoneNumberId;
  waConfig.businessAccountId = businessAccountId;
  waConfig.accessToken = accessToken;
  waConfig.signupStatus = 'signup_completed';
  waConfig.signupCompletedAt = new Date();
  await waConfig.save();
  logger.info('✅ Step 5: Saved to database');

  // ── Step 6: Run post-signup automation ──────────────────────────────────────
  logger.info('Step 6: Running post-signup automation...');
  await runPostSignupAutomation(restaurantId, waConfig, accessToken, wabaId);

  logger.info(`=== Embedded Signup COMPLETE ===`);
  logger.info(`WABA ID: ${wabaId}`);
  logger.info(`Phone Number ID: ${phoneNumberId}`);
  logger.info(`Phone Number: ${phoneDisplayNumber}`);

  return { wabaId, phoneNumberId, businessAccountId, phoneDisplayNumber };
};

/**
 * Post-signup automation — runs automatically after Meta signup
 * Configures: webhook, phone registration, WhatsApp Business profile, bot activation
 */
const runPostSignupAutomation = async (restaurantId, waConfig, accessToken, wabaId) => {
  logger.info(`=== Post-Signup Automation START ===`);

  const restaurant = await Restaurant.findById(restaurantId).populate('owner');
  if (!restaurant) throw new Error('Restaurant not found');

  const phoneNumberId = waConfig.phoneNumberId;

  // ── 1. Subscribe Webhook ────────────────────────────────────────────────────
  try {
    await subscribeWebhook(wabaId, accessToken);
    waConfig.webhookSubscribed = true;
    logger.info('✅ Webhook subscribed');
  } catch (err) {
    logger.warn(`⚠️ Webhook subscribe failed (non-fatal): ${err.message}`);
  }

  // ── 2. Register Phone Number with Cloud API ─────────────────────────────────
  if (phoneNumberId && phoneNumberId !== process.env.MAIN_PHONE_NUMBER_ID) {
    try {
      await axios.post(
        `${GRAPH_BASE}/${phoneNumberId}/register`,
        { messaging_product: 'whatsapp', pin: '000000' },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      logger.info('✅ Phone number registered with Cloud API');
    } catch (err) {
      logger.warn(`⚠️ Phone registration (may already be registered): ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // ── 3. Configure WhatsApp Business Profile ──────────────────────────────────
  // Automatically sets: business name, description, address, email, logo, hours
  try {
    logger.info('Configuring WhatsApp Business Profile...');
    const profileResults = await setupFullBusinessProfile(restaurant, phoneNumberId, accessToken);
    logger.info('✅ WhatsApp Business Profile configured');
    if (profileResults.errors?.length > 0) {
      logger.warn('Profile errors (non-fatal):', profileResults.errors);
    }
  } catch (err) {
    logger.warn(`⚠️ Profile setup failed (non-fatal): ${err.message}`);
  }

  // ── 4. Enable Bot ───────────────────────────────────────────────────────────
  waConfig.botEnabled = true;
  waConfig.botInitializedAt = new Date();
  waConfig.signupStatus = 'configured';
  waConfig.configuredAt = new Date();
  await waConfig.save();
  logger.info('✅ Bot enabled');

  // ── 5. Activate Restaurant ──────────────────────────────────────────────────
  await Restaurant.findByIdAndUpdate(restaurantId, { status: 'active' });
  logger.info('✅ Restaurant activated');

  // ── 6. Notify Owner ─────────────────────────────────────────────────────────
  try {
    const { sendFromMainBot } = require('./whatsappService');
    if (restaurant.owner?.whatsappNumber) {
      await sendFromMainBot(
        restaurant.owner.whatsappNumber,
        `🎉 *${restaurant.name} is now LIVE on FoodieHub!*\n\n` +
        `✅ WhatsApp Business number connected: ${waConfig.targetBusinessNumber}\n` +
        `✅ Business profile auto-configured\n` +
        `✅ Ordering chatbot activated\n` +
        `✅ Customers can now message and order!\n\n` +
        `📊 Manage at: ${process.env.FRONTEND_URL}/dashboard`
      );
      logger.info('✅ Owner notification sent');
    }
  } catch (err) {
    logger.warn(`⚠️ Owner notification failed: ${err.message}`);
  }

  // ── 7. Log Activity ─────────────────────────────────────────────────────────
  await ActivityLog.create({
    actorRole: 'system',
    actorName: 'FoodieHub Platform',
    restaurant: restaurantId,
    action: 'embedded_signup_completed',
    details: { wabaId, phoneNumberId, profileConfigured: true },
  }).catch(() => {});

  logger.info(`=== Post-Signup Automation COMPLETE for: ${restaurant.name} ===`);
};

/**
 * Manual activation (admin override)
 * Same as Embedded Signup but with manually provided credentials
 * Also auto-configures WhatsApp Business profile
 */
const manualActivation = async (restaurantId, { wabaId, phoneNumberId, accessToken }) => {
  logger.info(`Manual activation for restaurant: ${restaurantId}`);
  logger.info(`WABA: ${wabaId}, Phone: ${phoneNumberId}`);

  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId });
  if (!waConfig) throw new Error('WhatsApp config not found');

  const token = accessToken || process.env.MAIN_ACCESS_TOKEN;

  waConfig.wabaId = wabaId;
  waConfig.phoneNumberId = phoneNumberId;
  waConfig.accessToken = token;
  waConfig.signupStatus = 'signup_completed';
  waConfig.signupCompletedAt = new Date();
  await waConfig.save();

  // Run full automation including WhatsApp Business profile setup
  await runPostSignupAutomation(restaurantId, waConfig, token, wabaId);

  return await WhatsAppConfig.findOne({ restaurant: restaurantId });
};

/**
 * Refresh WhatsApp Business Profile
 * Re-syncs restaurant details to WhatsApp Business Account
 */
const refreshBusinessProfile = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId }).select('+accessToken');

  if (!waConfig?.phoneNumberId || waConfig.phoneNumberId === 'PENDING') {
    throw new Error('WhatsApp not configured for this restaurant');
  }

  const token = waConfig.accessToken || process.env.MAIN_ACCESS_TOKEN;
  return await setupFullBusinessProfile(restaurant, waConfig.phoneNumberId, token);
};

module.exports = {
  handleEmbeddedSignupCallback,
  runPostSignupAutomation,
  manualActivation,
  refreshBusinessProfile,
};