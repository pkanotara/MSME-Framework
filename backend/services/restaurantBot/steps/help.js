const { sendBtn } = require("../utils/messenger");

const showHelp = async (ctx) => {
  const { restaurant, customer } = ctx;

  customer.botSession.step = "main_menu";
  await customer.save();

  await sendBtn(
    ctx,
    `Need help? I'm here 👍\n\n` +
      `📍 *Address:* ${restaurant.address || "Contact us"}\n` +
      `📧 *Email:* ${restaurant.email || "Contact us"}\n` +
      `🕐 *Hours:* Check our profile\n\n` +
      `What do you need?`,
    [
      { id: "cancel_order", title: "❌ Cancel Order" },
      { id: "main_menu", title: "🏠 Main Menu" },
      { id: "order_food", title: "🍕 Order Food" },
    ],
  );
};

module.exports = { showHelp };