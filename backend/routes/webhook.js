// const express = require("express");
// const router = express.Router();
// const crypto = require("crypto");
// const { handleOnboardingMessage } = require("../services/onboardingBotService");
// const {
//   handleRestaurantBotMessage,
// } = require("../services/restaurantBotService");
// const WhatsAppConfig = require("../models/WhatsAppConfig");
// const logger = require("../utils/logger");

// // ─── Webhook Verification (GET) ────────────────────────────────────────────
// router.get("/", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
//     logger.info("Webhook verified");
//     return res.status(200).send(challenge);
//   }
//   res.status(403).send("Forbidden");
// });

// // ─── Signature Verification ────────────────────────────────────────────────
// const verifySignature = (req) => {
//   const signature = req.headers["x-hub-signature-256"];
//   if (!signature) return false;
//   const expected =
//     "sha256=" +
//     crypto
//       .createHmac("sha256", process.env.META_APP_SECRET)
//       .update(req.body)
//       .digest("hex");
//   return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
// };

// // ─── Webhook Events (POST) ─────────────────────────────────────────────────
// router.post("/", async (req, res) => {
//   res.status(200).json({ status: "ok" });

//   try {
//     if (process.env.NODE_ENV === "production" && !verifySignature(req)) {
//       logger.warn("Webhook signature mismatch - ignoring");
//       return;
//     }


//     let body;
//     if (Buffer.isBuffer(req.body)) {
//       body = JSON.parse(req.body.toString("utf8"));
//     } else if (typeof req.body === "string") {
//       body = JSON.parse(req.body);
//     } else {
//       body = req.body;
//     }

//     console.log("🔔 Webhook received:", JSON.stringify(body).substring(0, 300));

//     if (body.object !== "whatsapp_business_account") {
//       console.log("⚠️ Not whatsapp_business_account, got:", body.object);
//       return;
//     }

//     for (const entry of body.entry || []) {
//       for (const change of entry.changes || []) {
//         console.log("📋 Change field:", change.field);
//         if (change.field !== "messages") continue;

//         const value = change.value;
//         const phoneNumberId = value?.metadata?.phone_number_id;
//         const messages = value?.messages || [];

//         console.log("📱 phoneNumberId:", phoneNumberId);
//         console.log("💬 messages count:", messages.length);
//         console.log("📊 statuses count:", (value?.statuses || []).length);

//         for (const message of messages) {
//           await processMessage(phoneNumberId, message, value);
//         }
//       }
//     }
//   } catch (err) {
//     logger.error("Webhook processing error:", err);
//     console.error("❌ Webhook error:", err.message);
//   }
// });

// const processMessage = async (phoneNumberId, message, value) => {
//   console.log("─────────────────────────────────");
//   console.log("📨 phoneNumberId    :", phoneNumberId);
//   console.log("📨 MAIN_PHONE_NUMBER:", process.env.MAIN_PHONE_NUMBER_ID);
//   console.log(
//     "📨 match            :",
//     phoneNumberId === process.env.MAIN_PHONE_NUMBER_ID,
//   );
//   console.log("📨 from             :", message.from);
//   console.log("📨 type             :", message.type);
//   console.log("📨 text             :", message.text?.body);
//   console.log("─────────────────────────────────");

//   const senderNumber = message.from;
//   const messageType = message.type;
//   let messageText = "";
//   let mediaUrl = null;
//   let interactiveReply = null;

//   if (messageType === "text") {
//     messageText = message.text?.body || "";
//   } else if (messageType === "interactive") {
//     const interactive = message.interactive;
//     if (interactive.type === "button_reply") {
//       interactiveReply = interactive.button_reply;
//       messageText = interactiveReply.id;
//     } else if (interactive.type === "list_reply") {
//       interactiveReply = interactive.list_reply;
//       messageText = interactiveReply.id;
//     }
//   } else if (["image", "document", "audio", "video"].includes(messageType)) {
//     mediaUrl = message[messageType]?.id;
//   }

//   const mainPhoneNumberId = process.env.MAIN_PHONE_NUMBER_ID;

//   if (phoneNumberId === mainPhoneNumberId) {
//     console.log("✅ Routing to ONBOARDING BOT for:", senderNumber);
//     await handleOnboardingMessage(
//       senderNumber,
//       messageText,
//       messageType,
//       mediaUrl,
//     );
//   } else {
//     console.log(
//       "🍽️ Routing to RESTAURANT BOT for phoneNumberId:",
//       phoneNumberId,
//     );
//     await handleRestaurantBotMessage(
//       phoneNumberId,
//       senderNumber,
//       messageText,
//       messageType,
//       interactiveReply,
//     );
//   }
// };

// module.exports = router;



const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { handleOnboardingMessage } = require('../services/onboardingBotService');
const { handleRestaurantBotMessage } = require('../services/restaurantBotService');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const logger = require('../utils/logger');

// ─── Webhook Verification (GET) ────────────────────────────────────────────
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    logger.info('Webhook verified');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

// ─── Signature Verification ────────────────────────────────────────────────
const verifySignature = (req) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(req.body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

// ─── Webhook Events (POST) ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  // Acknowledge immediately to Meta
  res.status(200).json({ status: 'ok' });

  try {
    if (process.env.NODE_ENV === 'production' && !verifySignature(req)) {
      logger.warn('Webhook signature mismatch - ignoring');
      return;
    }

    let body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString('utf8'));
    } else if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }

    console.log('🔔 Webhook received:', JSON.stringify(body).substring(0, 300));

    if (body.object !== 'whatsapp_business_account') {
      console.log('⚠️ Not whatsapp_business_account, got:', body.object);
      return;
    }

    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        console.log('📋 Change field:', change.field);
        if (change.field !== 'messages') continue;

        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const messages = value?.messages || [];
        const statuses = value?.statuses || [];

        console.log('📱 phoneNumberId:', phoneNumberId);
        console.log('💬 messages count:', messages.length);
        console.log('📊 statuses count:', statuses.length);

        for (const message of messages) {
          await processMessage(phoneNumberId, message, value);
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error:', err);
    console.error('❌ Webhook error:', err.message);
  }
});

const processMessage = async (phoneNumberId, message, value) => {
  console.log('─────────────────────────────────');
  console.log('📨 phoneNumberId    :', phoneNumberId);
  console.log('📨 MAIN_PHONE_NUMBER:', process.env.MAIN_PHONE_NUMBER_ID);
  console.log('📨 from             :', message.from);
  console.log('📨 type             :', message.type);
  console.log('📨 text             :', message.text?.body);
  console.log('─────────────────────────────────');

  const senderNumber = message.from;
  const messageType = message.type;
  let messageText = '';
  let mediaUrl = null;
  let interactiveReply = null;

  if (messageType === 'text') {
    messageText = message.text?.body || '';
  } else if (messageType === 'interactive') {
    const interactive = message.interactive;
    if (interactive.type === 'button_reply') {
      interactiveReply = interactive.button_reply;
      messageText = interactiveReply.id;
    } else if (interactive.type === 'list_reply') {
      interactiveReply = interactive.list_reply;
      messageText = interactiveReply.id;
    }
  } else if (['image', 'document', 'audio', 'video'].includes(messageType)) {
    mediaUrl = message[messageType]?.id;
  }

  const mainPhoneNumberId = process.env.MAIN_PHONE_NUMBER_ID;

  // ── ROUTING LOGIC ────────────────────────────────────────────────────────────
  // 
  // Priority order:
  // 1. Check if this phoneNumberId belongs to a specific restaurant's own number
  // 2. If yes → restaurant ordering bot
  // 3. If no, check if it's the main platform number → onboarding bot
  // 4. If neither → try restaurant bot anyway (in case main number is shared)

  // Check if a restaurant owns this specific phone number ID
  const restaurantConfig = await WhatsAppConfig.findOne({
    phoneNumberId,
    botEnabled: true,
    signupStatus: 'configured',
  });

  if (restaurantConfig && phoneNumberId !== mainPhoneNumberId) {
    // This is a restaurant's OWN dedicated WhatsApp number
    console.log('🍽️ Routing to RESTAURANT BOT (dedicated number) for:', senderNumber);
    await handleRestaurantBotMessage(phoneNumberId, senderNumber, messageText, messageType, interactiveReply);
    return;
  }

  if (phoneNumberId === mainPhoneNumberId) {
    // Message came to the main platform number
    // Check: is this sender a customer of an active restaurant that uses the main number?
    // (restaurants that haven't set up their own number yet share the main number)

    const sharedRestaurantConfig = await WhatsAppConfig.findOne({
      phoneNumberId: mainPhoneNumberId,
      botEnabled: true,
      signupStatus: 'configured',
      // This would be a restaurant using the main number as their business number
    });

    // Check if sender has an existing customer session with any restaurant
    const Customer = require('../models/Customer');
    const existingCustomer = await Customer.findOne({
      whatsappNumber: senderNumber,
      'botSession.step': { $ne: 'idle' },
    }).populate({
      path: 'restaurant',
      populate: { path: 'whatsappConfig' }
    });

    if (existingCustomer &&
        existingCustomer.restaurant?.whatsappConfig?.botEnabled &&
        existingCustomer.restaurant?.whatsappConfig?.phoneNumberId === mainPhoneNumberId) {
      // Customer is mid-order with a restaurant that uses the main number
      console.log('🍽️ Routing to RESTAURANT BOT (shared main number) for:', senderNumber);
      await handleRestaurantBotMessage(mainPhoneNumberId, senderNumber, messageText, messageType, interactiveReply);
      return;
    }

    // Default: send to onboarding bot (new restaurant owner signup)
    console.log('✅ Routing to ONBOARDING BOT for:', senderNumber);
    await handleOnboardingMessage(senderNumber, messageText, messageType, mediaUrl);
    return;
  }

  // Fallback: try restaurant bot
  console.log('🔄 Fallback: trying restaurant bot for phoneNumberId:', phoneNumberId);
  await handleRestaurantBotMessage(phoneNumberId, senderNumber, messageText, messageType, interactiveReply);
};

module.exports = router;