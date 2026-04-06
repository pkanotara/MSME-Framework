const axios = require('axios');
const Restaurant = require('../models/Restaurant');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const { exchangeToken, subscribeWebhook } = require('./whatsappService');
const { setupFullBusinessProfile } = require('./whatsappProfileService');
const { ActivityLog } = require('../models/Logs');
const logger = require('../utils/logger');

const GRAPH_BASE = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v19.0'}`;
const COEXISTENCE_SESSION_EVENT = 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING';
const COEXISTENCE_EXTRA_WEBHOOKS = ['history', 'smb_app_state_sync', 'smb_message_echoes'];

// ── Helpers ──────────────────────────────────────────────────────────────────

const failSetup = async (waConfig, step, err) => {
  const metaCode = err?.response?.data?.error?.code?.toString() || null;
  const msg = err?.response?.data?.error?.message || err?.message || String(err);
  waConfig.signupStatus = 'failed';
  waConfig.lastSetupStep = step;
  waConfig.lastSetupError = msg;
  waConfig.lastMetaErrorCode = metaCode;
  waConfig.retryCount = (waConfig.retryCount || 0) + 1;
  waConfig.errorAt = new Date();
  await waConfig.save();
  logger.error(`❌ [${step}] ${msg}${metaCode ? ` (Meta code: ${metaCode})` : ''}`);
  throw new Error(`[${step}] ${msg}`);
};

// ── Main callback handler ─────────────────────────────────────────────────────

/**
 * Handle Meta Embedded Signup OAuth callback.
 * @param {string} code  - OAuth authorization code from Meta
 * @param {string} restaurantId
 * @param {object} sessionMeta - { metaSessionEvent, selectedPhoneNumberId } from state/session
 */
const handleEmbeddedSignupCallback = async (code, restaurantId, sessionMeta = {}) => {
  logger.info(`=== Embedded Signup START for restaurant: ${restaurantId} ===`);

  // ── Step 0: Load & validate config ─────────────────────────────────────────
  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId }).select('+accessToken');
  if (!waConfig) throw new Error('WhatsApp config not found for this restaurant');

  if (waConfig.signupStatus === 'configured') {
    logger.warn(`Signup already configured for restaurant ${restaurantId} — skipping duplicate callback`);
    return {
      wabaId: waConfig.wabaId,
      phoneNumberId: waConfig.phoneNumberId,
      businessAccountId: waConfig.businessAccountId,
      phoneDisplayNumber: waConfig.targetBusinessNumber,
    };
  }

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
    await failSetup(waConfig, 'token_exchange', err);
  }

  waConfig.signupStatus = 'oauth_completed';
  await waConfig.save();

  // ── Step 2: Exchange for long-lived token ───────────────────────────────────
  logger.info('Step 2: Getting long-lived token...');
  let accessToken = shortLivedToken;
  try {
    accessToken = await exchangeToken(shortLivedToken);
    logger.info('✅ Step 2: Long-lived token obtained');
  } catch (err) {
    logger.warn('⚠️ Step 2: Using short-lived token:', err.message);
  }

  // ── Step 3: Resolve WABA ID ─────────────────────────────────────────────────
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

  if (!wabaId) {
    await failSetup(waConfig, 'waba_resolution', new Error(
      'Could not resolve WABA ID from OAuth token. No fallback allowed — please retry signup.'
    ));
  }

  logger.info(`Using WABA ID: ${wabaId}`);

  // ── Step 4: Resolve exact Phone Number ID ───────────────────────────────────
  logger.info('Step 4: Fetching phone numbers...');
  let phoneNumberId = null;
  let phoneDisplayNumber = null;

  try {
    const res = await axios.get(`${GRAPH_BASE}/${wabaId}/phone_numbers`, {
      params: {
        access_token: accessToken,
        fields: 'id,display_phone_number,verified_name,code_verification_status,is_on_biz_app,platform_type',
      },
    });
    const phones = res.data.data || [];
    logger.info(`Found ${phones.length} phone number(s):`);
    phones.forEach(p =>
      logger.info(`  - ${p.display_phone_number} (${p.id}) status: ${p.code_verification_status} biz_app: ${p.is_on_biz_app} platform: ${p.platform_type}`)
    );

    // Prefer the exact phone number ID passed from the session/state
    const { selectedPhoneNumberId } = sessionMeta;
    let matched = selectedPhoneNumberId
      ? phones.find(p => p.id === selectedPhoneNumberId)
      : null;

    if (!matched && phones.length === 1) {
      matched = phones[0];
      logger.info('Only one phone number found — using it directly');
    }

    if (!matched) {
      await failSetup(waConfig, 'phone_resolution', new Error(
        phones.length === 0
          ? 'No phone numbers found under this WABA.'
          : `Multiple phone numbers found but no selectedPhoneNumberId in session to disambiguate. ` +
            `IDs: ${phones.map(p => p.id).join(', ')}`
      ));
    }

    phoneNumberId = matched.id;
    phoneDisplayNumber = matched.display_phone_number;
    logger.info(`✅ Using Phone Number ID: ${phoneNumberId} (${phoneDisplayNumber})`);
  } catch (err) {
    if (err.message.startsWith('[phone_resolution]') || err.message.startsWith('[')) throw err;
    await failSetup(waConfig, 'phone_fetch', err);
  }

  // ── Step 5: Determine signup mode ───────────────────────────────────────────
  const metaSessionEvent = sessionMeta.metaSessionEvent || null;
  const signupMode = metaSessionEvent === COEXISTENCE_SESSION_EVENT ? 'coexistence' : 'cloud_api';
  logger.info(`Signup mode: ${signupMode} (event: ${metaSessionEvent})`);

  // ── Step 6: Save resolved assets ────────────────────────────────────────────
  logger.info('Step 6: Saving to database...');
  waConfig.wabaId = wabaId;
  waConfig.selectedWabaId = wabaId;
  waConfig.phoneNumberId = phoneNumberId;
  waConfig.selectedPhoneNumberId = phoneNumberId;
  waConfig.businessAccountId = businessAccountId;
  waConfig.accessToken = accessToken;
  waConfig.signupMode = signupMode;
  waConfig.metaSessionEvent = metaSessionEvent;
  waConfig.signupStatus = 'assets_resolved';
  waConfig.signupCompletedAt = new Date();
  await waConfig.save();
  logger.info('✅ Step 6: Saved to database');

  // ── Step 7: Run post-signup automation ──────────────────────────────────────
  logger.info('Step 7: Running post-signup automation...');
  await runPostSignupAutomation(restaurantId, waConfig, accessToken, wabaId);

  logger.info(`=== Embedded Signup COMPLETE ===`);
  logger.info(`WABA ID: ${wabaId}, Phone Number ID: ${phoneNumberId}, Phone: ${phoneDisplayNumber}`);

  return { wabaId, phoneNumberId, businessAccountId, phoneDisplayNumber };
};

// ── Post-signup automation ────────────────────────────────────────────────────

/**
 * Idempotent post-signup automation.
 * Safe to call multiple times — each step is guarded.
 */
const runPostSignupAutomation = async (restaurantId, waConfig, accessToken, wabaId) => {
  logger.info(`=== Post-Signup Automation START ===`);

  if (waConfig.signupStatus === 'configured') {
    logger.info('Already configured — skipping automation');
    return;
  }

  const restaurant = await Restaurant.findById(restaurantId).populate('owner');
  if (!restaurant) throw new Error('Restaurant not found');

  const phoneNumberId = waConfig.phoneNumberId;
  const isCoexistence = waConfig.signupMode === 'coexistence';

  // ── 1. Subscribe Webhook ────────────────────────────────────────────────────
  if (!waConfig.webhookSubscribed) {
    try {
      await subscribeWebhook(wabaId, accessToken);
      waConfig.webhookSubscribed = true;
      logger.info('✅ Webhook subscribed');

      if (isCoexistence) {
        await subscribeCoexistenceWebhooks(wabaId, accessToken);
      }
    } catch (err) {
      logger.warn(`⚠️ Webhook subscribe failed (non-fatal): ${err.message}`);
    }
  }

  // ── 2. Register Phone Number (cloud_api only) ───────────────────────────────
  if (!isCoexistence) {
    const pin = process.env.WA_REGISTRATION_PIN;
    if (!pin || pin.length !== 6) {
      await failSetup(waConfig, 'phone_registration', new Error(
        'WA_REGISTRATION_PIN env var is missing or not 6 digits. Cannot register phone number.'
      ));
    }
    try {
      await axios.post(
        `${GRAPH_BASE}/${phoneNumberId}/register`,
        { messaging_product: 'whatsapp', pin },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      logger.info('✅ Phone number registered with Cloud API');
    } catch (err) {
      const metaMsg = err.response?.data?.error?.message || err.message;
      const metaCode = err.response?.data?.error?.code;
      // Code 2388023 = already registered — treat as success
      if (metaCode === 2388023 || metaMsg.includes('already registered')) {
        logger.info('ℹ️ Phone already registered — continuing');
      } else {
        logger.warn(`⚠️ Phone registration failed: ${metaMsg} (code: ${metaCode})`);
        waConfig.lastSetupStep = 'phone_registration';
        waConfig.lastSetupError = metaMsg;
        waConfig.lastMetaErrorCode = metaCode?.toString();
        // Non-fatal: log but continue so profile/bot can still be set up
      }
    }
  } else {
    // Coexistence: skip registration, start sync within 24h
    if (!waConfig.coexistenceSyncStartedAt) {
      waConfig.coexistenceSyncStartedAt = new Date();
      logger.info('✅ Coexistence sync window started (24h deadline)');
    }
  }

  // ── 3. Configure WhatsApp Business Profile ──────────────────────────────────
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
  if (!waConfig.botEnabled) {
    waConfig.botEnabled = true;
    waConfig.botInitializedAt = new Date();
    logger.info('✅ Bot enabled');
  }

  waConfig.signupStatus = 'configured';
  waConfig.configuredAt = new Date();
  await waConfig.save();

  // ── 5. Activate Restaurant ──────────────────────────────────────────────────
  await Restaurant.findByIdAndUpdate(restaurantId, { status: 'active' });
  logger.info('✅ Restaurant activated');

  // ── 6. Notify Owner ─────────────────────────────────────────────────────────
  try {
    const { sendFromMainBot } = require('./whatsappService');
    if (restaurant.owner?.whatsappNumber) {
      await sendFromMainBot(
        restaurant.owner.whatsappNumber,
        `🎉 *${restaurant.name} is now LIVE on ChatServe!*\n\n` +
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
    actorName: 'ChatServe Platform',
    restaurant: restaurantId,
    action: 'embedded_signup_completed',
    details: { wabaId, phoneNumberId, signupMode: waConfig.signupMode, profileConfigured: true },
  }).catch(() => {});

  logger.info(`=== Post-Signup Automation COMPLETE for: ${restaurant.name} ===`);
};

// ── Coexistence extra webhooks ────────────────────────────────────────────────

const subscribeCoexistenceWebhooks = async (wabaId, accessToken) => {
  try {
    await axios.post(
      `${GRAPH_BASE}/${wabaId}/subscribed_apps`,
      { subscribed_fields: COEXISTENCE_EXTRA_WEBHOOKS },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    logger.info(`✅ Coexistence extra webhooks subscribed: ${COEXISTENCE_EXTRA_WEBHOOKS.join(', ')}`);
  } catch (err) {
    logger.warn(`⚠️ Coexistence webhook subscription failed: ${err.response?.data?.error?.message || err.message}`);
  }
};

// ── Manual activation (admin override) ───────────────────────────────────────

const manualActivation = async (restaurantId, { wabaId, phoneNumberId, accessToken, signupMode = 'cloud_api' }) => {
  logger.info(`Manual activation for restaurant: ${restaurantId}`);
  logger.info(`WABA: ${wabaId}, Phone: ${phoneNumberId}, Mode: ${signupMode}`);

  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId }).select('+accessToken');
  if (!waConfig) throw new Error('WhatsApp config not found');

  if (!accessToken) throw new Error('accessToken is required for manual activation');

  waConfig.wabaId = wabaId;
  waConfig.selectedWabaId = wabaId;
  waConfig.phoneNumberId = phoneNumberId;
  waConfig.selectedPhoneNumberId = phoneNumberId;
  waConfig.accessToken = accessToken;
  waConfig.signupMode = signupMode;
  waConfig.signupStatus = 'assets_resolved';
  waConfig.signupCompletedAt = new Date();
  await waConfig.save();

  await runPostSignupAutomation(restaurantId, waConfig, accessToken, wabaId);

  return await WhatsAppConfig.findOne({ restaurant: restaurantId });
};

// ── Refresh business profile ──────────────────────────────────────────────────

const refreshBusinessProfile = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  const waConfig = await WhatsAppConfig.findOne({ restaurant: restaurantId }).select('+accessToken');

  if (!waConfig?.phoneNumberId || waConfig.phoneNumberId === 'PENDING') {
    throw new Error('WhatsApp not configured for this restaurant');
  }

  if (!waConfig.accessToken) {
    throw new Error('No access token stored for this restaurant — cannot refresh profile');
  }

  return await setupFullBusinessProfile(restaurant, waConfig.phoneNumberId, waConfig.accessToken);
};

module.exports = {
  handleEmbeddedSignupCallback,
  runPostSignupAutomation,
  manualActivation,
  refreshBusinessProfile,
};
