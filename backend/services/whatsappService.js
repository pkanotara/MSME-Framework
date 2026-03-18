const axios = require('axios');
const logger = require('../utils/logger');

const GRAPH_BASE = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v19.0'}`;

/**
 * Send a text message via WhatsApp Cloud API
 * @param {string} phoneNumberId - The sender Phone Number ID
 * @param {string} accessToken - Access token
 * @param {string} to - Recipient WA number (with country code, no +)
 * @param {string} text - Message text
 */
const sendTextMessage = async (phoneNumberId, accessToken, to, text) => {
  try {
    const response = await axios.post(
      `${GRAPH_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (err) {
    logger.error(`WhatsApp send error to ${to}:`, err.response?.data || err.message);
    throw err;
  }
};

/**
 * Send an interactive list message
 */
const sendListMessage = async (phoneNumberId, accessToken, to, header, body, footer, buttonText, sections) => {
  try {
    const response = await axios.post(
      `${GRAPH_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: header ? { type: 'text', text: header } : undefined,
          body: { text: body },
          footer: footer ? { text: footer } : undefined,
          action: { button: buttonText, sections },
        },
      },
      {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (err) {
    logger.error(`WhatsApp list message error:`, err.response?.data || err.message);
    throw err;
  }
};

/**
 * Send quick reply buttons
 */
const sendButtonMessage = async (phoneNumberId, accessToken, to, bodyText, buttons) => {
  try {
    const response = await axios.post(
      `${GRAPH_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map((btn, i) => ({
              type: 'reply',
              reply: { id: btn.id || `btn_${i}`, title: btn.title },
            })),
          },
        },
      },
      {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (err) {
    logger.error(`WhatsApp button message error:`, err.response?.data || err.message);
    throw err;
  }
};

/**
 * Mark a message as read
 */
const markAsRead = async (phoneNumberId, accessToken, messageId) => {
  try {
    await axios.post(
      `${GRAPH_BASE}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (err) {
    logger.warn(`Mark as read failed: ${err.message}`);
  }
};

/**
 * Register webhook subscriptions for a WABA
 */
const subscribeWebhook = async (wabaId, accessToken) => {
  try {
    const response = await axios.post(
      `${GRAPH_BASE}/${wabaId}/subscribed_apps`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  } catch (err) {
    logger.error(`Webhook subscribe error:`, err.response?.data || err.message);
    throw err;
  }
};

/**
 * Exchange short-lived token for long-lived token
 */
const exchangeToken = async (shortLivedToken) => {
  try {
    const response = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });
    return response.data.access_token;
  } catch (err) {
    logger.error(`Token exchange error:`, err.response?.data || err.message);
    throw err;
  }
};

/**
 * Use the main platform bot (our own number) to send a message
 */
const sendFromMainBot = (to, text) => {
  return sendTextMessage(
    process.env.MAIN_PHONE_NUMBER_ID,
    process.env.MAIN_ACCESS_TOKEN,
    to,
    text
  );
};

const sendButtonFromMainBot = (to, bodyText, buttons) => {
  return sendButtonMessage(
    process.env.MAIN_PHONE_NUMBER_ID,
    process.env.MAIN_ACCESS_TOKEN,
    to,
    bodyText,
    buttons
  );
};

module.exports = {
  sendTextMessage,
  sendListMessage,
  sendButtonMessage,
  markAsRead,
  subscribeWebhook,
  exchangeToken,
  sendFromMainBot,
  sendButtonFromMainBot,
};
