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
 */
const handleEmbeddedSignupCallback = async (code, restaurantId) => {
  logger.info(`=== Embedded Signup Callback START for restaurant: ${restaurantId} ===`);

  // Step 1: Exchange auth code for access token
  let shortLivedToken;
  try {
    const tokenResponse = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.EMBEDDED_SIGNUP_REDIRECT_URI,
        code,
      },
    });
    shortLivedToken = tokenResponse.data.access_token;
    logger.info('Step 1: Token exchange SUCCESS');
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    logger.error('Step 1 FAILED:', err.response?.data || err.message);
    throw new Error(`Token exchange failed: ${errMsg}`);
  }

  // Step 2: Get long-lived token
  let longLivedToken = shortLivedToken;
  try {
    longLivedToken = await exchangeToken(shortLivedToken);
    logger.info('Step 2: Long-lived token SUCCESS');
  } catch (err) {
    logger.warn('Step 2: Using short-lived token:', err.message);
  }

  // Step 3: Find WABA ID using multiple methods
  let wabaId = null;
  let businessAccountId = null;

  // Method A: Direct WABA endpoint
  try {
    const wabaResponse = await axios.get(`${GRAPH_BASE}/me/whatsapp_business_accounts`, {
      params: { access_token: longLivedToken },
    });
    const wabaList = wabaResponse.data.data || [];
    if (wabaList.length > 0) {
      wabaId = wabaList[0].id;
      logger.info(`Method A: Found WABA ID: ${wabaId}`);
    }
  } catch (err) {
    logger.warn('Method A failed:', err.response?.data?.error?.message || err.message);
  }

  // Method B: Via businesses
  if (!wabaId) {
    try {
      const bizResponse = await axios.get(`${GRAPH_BASE}/me/businesses`, {
        params: {
          access_token: longLivedToken,
          fields: 'id,name,whatsapp_business_accounts{id,name}',
        },
      });
      for (const biz of (bizResponse.data.data || [])) {
        businessAccountId = biz.id;
        const wabas = biz.whatsapp_business_accounts?.data || [];
        if (wabas.length > 0) {
          wabaId = wabas[0].id;
          logger.info(`Method B: Found WABA ID: ${wabaId}`);
          break;
        }
      }
    } catch (err) {
      logger.warn('Method B failed:', err.response?.data?.error?.message || err.message);
    }
  }

  // Method C: From token granular scopes
  if (!wabaId) {
    try {
      const debugResponse = await axios.get(`${GRAPH_BASE}/debug_token`, {
        params: {
          input_token: longLivedToken,
          access_token: `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`,
        },
      });
      const scopes = debugResponse.data.data?.granular_scopes || [];
      for (const scope of scopes) {
        if (scope.scope === 'whatsapp_business_management' && scope.target_ids?.length > 0) {
          wabaId = scope.target_ids[0];
          logger.info(`Method C: Found WABA ID from scope: ${wabaId}`);
          break;
        }
      }
    } catch (err) {
      logger.warn('Method C failed:', err.response?.data?.error?.message || err.message);
    }
  }

  if (!wabaId) {
    throw new Error('No WhatsApp Business Account found. Please ensure you selected a WhatsApp Business Account during signup.');
  }

  // Step 4: Get phone numbers
  let phoneNumberId = null;
  let phoneDisplayNumber = null;

  try {
    const phoneResponse = await axios.get(`${GRAPH_BASE}/${wabaId}/phone_numbers`, {
      params: {
        access_token: longLivedToken,
        fields: 'id,display_phone_number,verified_name,code_verification_status',
      },
    });
    const phones = phoneResponse.data.data || [];
    if (phones.length > 0) {
      phoneNumberId = phones[0].id;
      phoneDisplayNumber = phones[0].display_phone_number;
      logger.info(`Phone Number ID: ${phoneNumberId} (${phoneDisplayNumber})`);
    }
  } catch (err) {
    logger.error('Phone numbers fetch failed:', err.response?.data || err.message);
    throw new Error(`Could not fetch phone numbers: ${err.response?.data?.error?.message || err.message}`);
  }

  // Step 5: Save to database
  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId });
  if (!waConfig) throw new Error('WhatsApp config not found');

  waConfig.wabaId = wabaId;
  waConfig.phoneNumberId = phoneNumberId || 'NOT_FOUND';
  waConfig.businessAccountId = businessAccountId;
  waConfig.accessToken = longLivedToken;
  waConfig.signupStatus = 'signup_completed';
  waConfig.signupCompletedAt = new Date();
  await waConfig.save();

  // Step 6: Run full post-signup automation
  await runPostSignupAutomation(restaurantId, waConfig, longLivedToken, wabaId);

  logger.info(`=== Embedded Signup COMPLETE: WABA=${wabaId} Phone=${phoneNumberId} ===`);
  return { wabaId, phoneNumberId, businessAccountId, phoneDisplayNumber };
};

/**
 * Full post-signup automation — runs automatically after Meta signup
 */
const runPostSignupAutomation = async (restaurantId, waConfig, accessToken, wabaId) => {
  logger.info(`=== Post-Signup Automation START for restaurant: ${restaurantId} ===`);

  const restaurant = await Restaurant.findById(restaurantId).populate('owner');
  if (!restaurant) throw new Error('Restaurant not found');

  const phoneNumberId = waConfig.phoneNumberId;

  // ── 1. Subscribe Webhook ────────────────────────────────────────────────────
  try {
    await subscribeWebhook(wabaId, accessToken);
    waConfig.webhookSubscribed = true;
    logger.info('✅ Webhook subscribed');
  } catch (err) {
    logger.warn(`⚠️ Webhook subscribe failed: ${err.message}`);
  }

  // ── 2. Register Phone Number with Cloud API ─────────────────────────────────
  if (phoneNumberId && phoneNumberId !== 'NOT_FOUND' && phoneNumberId !== 'PENDING') {
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
  // This sets name, description, address, email, logo, hours in WhatsApp app
  if (phoneNumberId && phoneNumberId !== 'NOT_FOUND' && phoneNumberId !== 'PENDING') {
    try {
      logger.info('Configuring WhatsApp Business Profile...');
      const profileResults = await setupFullBusinessProfile(restaurant, phoneNumberId, accessToken);
      logger.info('✅ WhatsApp Business Profile configured:', JSON.stringify(profileResults));

      if (profileResults.errors && profileResults.errors.length > 0) {
        logger.warn('Profile setup had some errors:', profileResults.errors);
      }
    } catch (err) {
      logger.warn(`⚠️ Profile setup failed (non-fatal): ${err.message}`);
    }
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

  // ── 6. Notify Owner via WhatsApp ────────────────────────────────────────────
  try {
    const { sendFromMainBot } = require('./whatsappService');
    if (restaurant.owner?.whatsappNumber) {
      await sendFromMainBot(
        restaurant.owner.whatsappNumber,
        `🎉 *${restaurant.name} is now LIVE on FoodieHub!*\n\n` +
        `✅ WhatsApp Business number connected\n` +
        `✅ Business profile configured\n` +
        `✅ Ordering chatbot activated\n` +
        `✅ Customers can now message and order!\n\n` +
        `📱 Your business profile has been updated with:\n` +
        `• Name: ${restaurant.name}\n` +
        `• Description & address\n` +
        `• Working hours\n` +
        `• Business category: Restaurant\n` +
        (restaurant.logoUrl ? `• Logo uploaded\n` : '') +
        `\n📊 Manage everything at:\n${process.env.FRONTEND_URL}/dashboard`
      );
      logger.info('✅ Owner notification sent');
    }
  } catch (err) {
    logger.warn(`⚠️ Owner notification failed: ${err.message}`);
  }

  // ── 7. Activity Log ─────────────────────────────────────────────────────────
  await ActivityLog.create({
    actorRole: 'system',
    actorName: 'FoodieHub Platform',
    restaurant: restaurantId,
    action: 'post_signup_automation_completed',
    details: {
      wabaId,
      phoneNumberId,
      webhookSubscribed: waConfig.webhookSubscribed,
      profileConfigured: true,
    },
  }).catch(() => {});

  logger.info(`=== Post-Signup Automation COMPLETE for: ${restaurant.name} ===`);
};

/**
 * Manual activation (admin override)
 * Also configures WhatsApp Business Profile automatically
 */
const manualActivation = async (restaurantId, { wabaId, phoneNumberId, accessToken }) => {
  logger.info(`Manual activation for restaurant: ${restaurantId}`);

  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId });
  if (!waConfig) throw new Error('WhatsApp config not found');

  const token = accessToken || process.env.MAIN_ACCESS_TOKEN;

  waConfig.wabaId = wabaId;
  waConfig.phoneNumberId = phoneNumberId;
  waConfig.accessToken = token;
  waConfig.signupStatus = 'signup_completed';
  waConfig.signupCompletedAt = new Date();
  await waConfig.save();

  // Run full automation including profile setup
  await runPostSignupAutomation(restaurantId, waConfig, token, wabaId);

  return await WhatsAppConfig.findOne({ restaurant: restaurantId });
};

/**
 * Update profile only (can be called from admin or when restaurant updates their info)
 */
const refreshBusinessProfile = async (restaurantId) => {
  logger.info(`Refreshing business profile for restaurant: ${restaurantId}`);

  const restaurant = await Restaurant.findById(restaurantId);
  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId }).select('+accessToken');

  if (!waConfig || !waConfig.phoneNumberId || waConfig.phoneNumberId === 'PENDING') {
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