const { sendFromMainBot } = require('./whatsappService');
const logger = require('../utils/logger');

const sendDashboardCredentials = async (whatsappNumber, email, tempPassword, dashboardUrl) => {
  try {
    await sendFromMainBot(whatsappNumber,
      `🔐 *Your ChatServe Dashboard*\n\nURL: ${dashboardUrl}/login\nEmail: ${email}\nPassword: ${tempPassword}\n\n⚠️ Please change your password after first login!`
    );
  } catch (err) {
    logger.error('Failed to send dashboard credentials via WhatsApp:', err.message);
  }
};

const sendOrderUpdateToCustomer = async (phoneNumberId, accessToken, customerNumber, order, restaurantName) => {
  const statusMessages = {
    confirmed: `✅ Your order #${order.orderNumber} from *${restaurantName}* has been *confirmed*!`,
    preparing: `👨‍🍳 Your order #${order.orderNumber} is being *prepared*!`,
    ready: `📦 Your order #${order.orderNumber} is *ready*!`,
    delivered: `🎉 Your order #${order.orderNumber} has been *delivered*! Enjoy your meal!`,
    cancelled: `❌ Your order #${order.orderNumber} has been *cancelled*. Contact the restaurant for more info.`,
  };

  const msg = statusMessages[order.status];
  if (!msg) return;

  const { sendTextMessage } = require('./whatsappService');
  await sendTextMessage(phoneNumberId, accessToken, customerNumber, msg).catch(err =>
    logger.warn(`Order update notification failed: ${err.message}`)
  );
};

module.exports = { sendDashboardCredentials, sendOrderUpdateToCustomer };
