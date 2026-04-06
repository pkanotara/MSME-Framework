const Order = require("../../../models/Order");
const { sendBtn } = require("../utils/messenger");

const showTrackOrder = async (ctx) => {
  const { restaurant, customer } = ctx;
  const to = customer.whatsappNumber;

  const lastOrder = await Order.findOne({
    restaurant: restaurant._id,
    customerNumber: to,
  }).sort({ createdAt: -1 });

  if (!lastOrder) {
    await sendBtn(ctx, `📦 No recent orders found.\n\nPlace your first order!`, [
      { id: "order_food", title: "🍕 Order Now" },
      { id: "main_menu", title: "🏠 Main Menu" },
    ]);
    return;
  }

  const statusMap = {
    pending: "⏳ Order received",
    confirmed: "✅ Order confirmed",
    preparing: "👨‍🍳 Being prepared",
    ready: "📦 Ready for pickup/delivery",
    delivered: "🎉 Delivered!",
    cancelled: "❌ Cancelled",
  };

  customer.botSession.step = "main_menu";
  await customer.save();

  await sendBtn(
    ctx,
    `📦 *Order Tracking*\n\n` +
      `Order: *${lastOrder.orderNumber}*\n` +
      `Status: *${statusMap[lastOrder.status] || lastOrder.status}*\n\n` +
      `Total: ₹${lastOrder.total}`,
    [
      { id: "main_menu", title: "🏠 Main Menu" },
      { id: "order_food", title: "🔁 Order Again" },
    ],
  );
};

const handleCancelOrder = async (ctx) => {
  const { restaurant, customer } = ctx;
  const to = customer.whatsappNumber;

  const lastOrder = await Order.findOne({
    restaurant: restaurant._id,
    customerNumber: to,
    status: { $in: ["pending", "confirmed"] },
  }).sort({ createdAt: -1 });

  if (!lastOrder) {
    await sendBtn(ctx, `No active orders to cancel.`, [
      { id: "order_food", title: "🍕 Order Food" },
      { id: "main_menu", title: "🏠 Main Menu" },
    ]);
    return;
  }

  lastOrder.status = "cancelled";
  // If your Order schema does not have statusHistory, remove the next line
  if (Array.isArray(lastOrder.statusHistory)) {
    lastOrder.statusHistory.push({ status: "cancelled", changedBy: "customer" });
  }
  await lastOrder.save();

  customer.botSession.step = "idle";
  await customer.save();

  await sendBtn(
    ctx,
    `❌ Order *${lastOrder.orderNumber}* has been cancelled.\n\nWe hope to see you again soon!`,
    [
      { id: "order_food", title: "🍕 Order Again" },
      { id: "main_menu", title: "🏠 Main Menu" },
    ],
  );
};

module.exports = { showTrackOrder, handleCancelOrder };