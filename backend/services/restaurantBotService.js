// const Customer = require('../models/Customer');
// const Order = require('../models/Order');
// const Restaurant = require('../models/Restaurant');
// const WhatsAppConfig = require('../models/WhatsAppConfig');
// const { MenuCategory, MenuItem } = require('../models/Menu');
// const { sendTextMessage, sendListMessage, sendButtonMessage } = require('./whatsappService');
// const logger = require('../utils/logger');

// /**
//  * Handle inbound messages for a specific restaurant's WhatsApp Business number
//  * This is called when message arrives on a restaurant's OWN phone number (not main bot)
//  */
// const handleRestaurantBotMessage = async (
//   phoneNumberId,
//   senderNumber,
//   messageText,
//   messageType,
//   interactiveReply
// ) => {
//   try {
//     // Find WhatsApp config for this phone number
//     const waConfig = await WhatsAppConfig.findOne({ phoneNumberId }).select('+accessToken');
//     if (!waConfig) {
//       logger.warn(`No WhatsApp config found for phoneNumberId: ${phoneNumberId}`);
//       return;
//     }
//     if (!waConfig.botEnabled) {
//       logger.debug(`Bot disabled for phoneNumberId: ${phoneNumberId}`);
//       return;
//     }

//     const restaurant = await Restaurant.findById(waConfig.restaurant);
//     if (!restaurant || restaurant.status !== 'active') {
//       logger.warn(`Restaurant not active for phoneNumberId: ${phoneNumberId}`);
//       return;
//     }

//     // Use restaurant's own access token if available, fallback to main
//     const token = waConfig.accessToken || process.env.MAIN_ACCESS_TOKEN;

//     // Get or create customer record
//     let customer = await Customer.findOne({
//       restaurant: restaurant._id,
//       whatsappNumber: senderNumber,
//     });
//     if (!customer) {
//       customer = await Customer.create({
//         restaurant: restaurant._id,
//         whatsappNumber: senderNumber,
//         botSession: { step: 'idle', cart: [], lastActivity: new Date() },
//       });
//     }

//     customer.botSession.lastActivity = new Date();

//     // Determine text to process
//     const inputText = interactiveReply?.id || interactiveReply?.title || messageText || '';

//     logger.debug(`Restaurant bot message: ${senderNumber} → ${restaurant.name} | ${inputText}`);

//     await processCustomerStep(restaurant, customer, waConfig, token, phoneNumberId, inputText, messageType);
//   } catch (err) {
//     logger.error('Restaurant bot error:', err.message);
//   }
// };

// // ── Message helpers ──────────────────────────────────────────────────────────
// const send = (phoneNumberId, token, to, text) =>
//   sendTextMessage(phoneNumberId, token, to, text);

// const sendButtons = (phoneNumberId, token, to, body, buttons) =>
//   sendButtonMessage(phoneNumberId, token, to, body, buttons);

// const sendList = (phoneNumberId, token, to, header, body, footer, btnText, sections) =>
//   sendListMessage(phoneNumberId, token, to, header, body, footer, btnText, sections);

// // ── Main step processor ──────────────────────────────────────────────────────
// const processCustomerStep = async (
//   restaurant, customer, waConfig, token, phoneNumberId, text, messageType
// ) => {
//   const { step } = customer.botSession;
//   const to = customer.whatsappNumber;
//   const lower = (text || '').toLowerCase().trim();

//   // ── Global commands (work from any step) ──────────────────────────────────
//   if (['hi', 'hello', 'hey', 'start', 'menu', 'hii', 'helo'].includes(lower)) {
//     await sendGreeting(restaurant, customer, waConfig, token, phoneNumberId);
//     return;
//   }
//   if (lower === 'cart' || text === 'view_cart') {
//     await sendCartSummary(restaurant, customer, token, phoneNumberId);
//     return;
//   }
//   if (lower === 'cancel' || text === 'cancel_order') {
//     customer.botSession.cart = [];
//     customer.botSession.step = 'idle';
//     await customer.save();
//     await send(phoneNumberId, token, to, `🛒 Cart cleared! Send *menu* to start again.`);
//     return;
//   }
//   if (['help', 'faq', 'info'].includes(lower) || text === 'faq') {
//     await sendFAQ(restaurant, token, phoneNumberId, to);
//     return;
//   }
//   if (lower === 'track' || text === 'track_order') {
//     await sendLastOrderStatus(restaurant, customer, token, phoneNumberId);
//     return;
//   }

//   // ── Step-based routing ────────────────────────────────────────────────────
//   switch (step) {
//     case 'browsing_categories':
//       await handleCategorySelection(restaurant, customer, token, phoneNumberId, text);
//       break;
//     case 'browsing_items':
//       await handleItemAction(restaurant, customer, token, phoneNumberId, text);
//       break;
//     case 'cart_review':
//       await handleCartAction(restaurant, customer, token, phoneNumberId, text);
//       break;
//     case 'confirm_order':
//       await handleOrderConfirmation(restaurant, customer, token, phoneNumberId, text);
//       break;
//     default:
//       await sendGreeting(restaurant, customer, waConfig, token, phoneNumberId);
//   }
// };

// // ── Greeting + Category List ─────────────────────────────────────────────────
// const sendGreeting = async (restaurant, customer, waConfig, token, phoneNumberId) => {
//   const to = customer.whatsappNumber;

//   customer.botSession.step = 'browsing_categories';
//   customer.botSession.cart = [];
//   await customer.save();

//   const categories = await MenuCategory.find({
//     restaurant: restaurant._id,
//     isActive: true,
//   }).sort('sortOrder');

//   if (categories.length === 0) {
//     await send(phoneNumberId, token, to,
//       `👋 Welcome to *${restaurant.name}*!\n\nWe're setting up our menu. Please check back soon! 🍽️`
//     );
//     return;
//   }

//   const sections = [{
//     title: 'Our Menu',
//     rows: categories.map(cat => ({
//       id: `cat_${cat._id}`,
//       title: cat.name.substring(0, 24),
//       description: cat.description?.substring(0, 72) || '',
//     })),
//   }];

//   await sendList(
//     phoneNumberId, token, to,
//     `🍽️ ${restaurant.name}`,
//     `Welcome! Browse our menu categories below.\n\n` +
//     `💬 Send *cart* to view cart\n💬 Send *help* for FAQ`,
//     null,
//     'View Menu',
//     sections
//   );
// };

// // ── Category → Items ─────────────────────────────────────────────────────────
// const handleCategorySelection = async (restaurant, customer, token, phoneNumberId, text) => {
//   const to = customer.whatsappNumber;

//   if (!text.startsWith('cat_')) {
//     await send(phoneNumberId, token, to,
//       `Please select a category from the menu. Send *menu* to see categories.`
//     );
//     return;
//   }

//   const categoryId = text.replace('cat_', '');
//   const [items, category] = await Promise.all([
//     MenuItem.find({ restaurant: restaurant._id, category: categoryId, isAvailable: true }).sort('sortOrder'),
//     MenuCategory.findById(categoryId),
//   ]);

//   if (!items.length) {
//     await send(phoneNumberId, token, to,
//       `😔 No items available in this category right now.\n\nSend *menu* to browse others.`
//     );
//     return;
//   }

//   customer.botSession.step = 'browsing_items';
//   customer.botSession.currentCategoryId = categoryId;
//   await customer.save();

//   const sections = [{
//     title: category?.name || 'Items',
//     rows: items.map(item => ({
//       id: `item_${item._id}`,
//       title: item.name.substring(0, 24),
//       description: `₹${item.price}${item.isVeg ? ' 🟢' : ' 🔴'} - ${(item.description || '').substring(0, 45)}`,
//     })),
//   }];

//   await sendList(
//     phoneNumberId, token, to,
//     `📂 ${category?.name || 'Menu'}`,
//     `Select an item to add to your cart:`,
//     `Send *menu* to go back`,
//     'Select Item',
//     sections
//   );
// };

// // ── Item action ───────────────────────────────────────────────────────────────
// const handleItemAction = async (restaurant, customer, token, phoneNumberId, text) => {
//   const to = customer.whatsappNumber;

//   if (text === 'menu') {
//     customer.botSession.step = 'browsing_categories';
//     await customer.save();
//     await sendGreeting(restaurant, customer, null, token, phoneNumberId);
//     return;
//   }

//   if (text.startsWith('item_')) {
//     const itemId = text.replace('item_', '');
//     const item = await MenuItem.findById(itemId);
//     if (!item) {
//       await send(phoneNumberId, token, to, `Item not found. Send *menu* to browse.`);
//       return;
//     }

//     const existing = customer.botSession.cart.find(c => c.item?.toString() === itemId);
//     if (existing) {
//       existing.quantity += 1;
//     } else {
//       customer.botSession.cart.push({
//         item: item._id,
//         name: item.name,
//         price: item.price,
//         quantity: 1,
//       });
//     }
//     await customer.save();

//     const total = customer.botSession.cart.reduce((s, i) => s + i.price * i.quantity, 0);

//     await sendButtons(phoneNumberId, token, to,
//       `✅ *${item.name}* added!\n` +
//       `💰 Price: ₹${item.price}\n` +
//       `🛒 Cart: ${customer.botSession.cart.length} item(s) | ₹${total}\n\nWhat next?`,
//       [
//         { id: 'view_cart', title: '🛒 View Cart' },
//         { id: 'menu', title: '🍽️ More Items' },
//       ]
//     );
//     return;
//   }

//   await send(phoneNumberId, token, to,
//     `Please select an item from the list, or send *menu* to browse categories.`
//   );
// };

// // ── Cart Summary ──────────────────────────────────────────────────────────────
// const sendCartSummary = async (restaurant, customer, token, phoneNumberId) => {
//   const to = customer.whatsappNumber;
//   const cart = customer.botSession.cart;

//   if (!cart || cart.length === 0) {
//     await send(phoneNumberId, token, to,
//       `🛒 Your cart is empty!\n\nSend *menu* to start ordering.`
//     );
//     return;
//   }

//   const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
//   const cartText = cart.map(i =>
//     `• ${i.name} ×${i.quantity} = ₹${i.price * i.quantity}`
//   ).join('\n');

//   customer.botSession.step = 'cart_review';
//   await customer.save();

//   await sendButtons(phoneNumberId, token, to,
//     `🛒 *Your Cart — ${restaurant.name}*\n\n${cartText}\n\n💰 *Total: ₹${total}*`,
//     [
//       { id: 'checkout', title: '✅ Place Order' },
//       { id: 'menu', title: '➕ Add More' },
//       { id: 'cancel_order', title: '🗑️ Clear Cart' },
//     ]
//   );
// };

// // ── Cart Actions ──────────────────────────────────────────────────────────────
// const handleCartAction = async (restaurant, customer, token, phoneNumberId, text) => {
//   if (text === 'checkout') {
//     customer.botSession.step = 'confirm_order';
//     await customer.save();
//     await sendButtons(phoneNumberId, token, customer.whatsappNumber,
//       `📋 *Confirm your order?*\n\n` +
//       `Items: ${customer.botSession.cart.length}\n` +
//       `Total: ₹${customer.botSession.cart.reduce((s, i) => s + i.price * i.quantity, 0)}\n\n` +
//       `Select payment method:`,
//       [
//         { id: 'pay_cod', title: '💵 Cash on Delivery' },
//         { id: 'pay_cancel', title: '❌ Cancel' },
//       ]
//     );
//   } else if (text === 'menu') {
//     customer.botSession.step = 'browsing_categories';
//     await customer.save();
//     await sendGreeting(restaurant, customer, null, token, phoneNumberId);
//   } else {
//     await sendCartSummary(restaurant, customer, token, phoneNumberId);
//   }
// };

// // ── Order Confirmation ────────────────────────────────────────────────────────
// const handleOrderConfirmation = async (restaurant, customer, token, phoneNumberId, text) => {
//   const to = customer.whatsappNumber;

//   if (text === 'pay_cod') {
//     try {
//       const order = new Order({
//         restaurant: restaurant._id,
//         customer: customer._id,
//         customerNumber: to,
//         items: customer.botSession.cart.map(i => ({
//           menuItem: i.item,
//           name: i.name,
//           price: i.price,
//           quantity: i.quantity,
//         })),
//         total: customer.botSession.cart.reduce((s, i) => s + i.price * i.quantity, 0),
//         paymentMethod: 'cash_on_delivery',
//         paymentStatus: 'pending',
//       });
//       await order.save();

//       // Update restaurant stats
//       await Restaurant.findByIdAndUpdate(restaurant._id, {
//         $inc: { totalOrders: 1, totalRevenue: order.total },
//       });

//       // Update customer stats
//       customer.totalOrders += 1;
//       customer.totalSpent += order.total;
//       customer.lastOrderAt = new Date();
//       customer.botSession.cart = [];
//       customer.botSession.step = 'idle';
//       await customer.save();

//       // Update menu item stats
//       for (const item of order.items) {
//         if (item.menuItem) {
//           await MenuItem.findByIdAndUpdate(item.menuItem, {
//             $inc: { totalOrdered: item.quantity },
//           });
//         }
//       }

//       await send(phoneNumberId, token, to,
//         `🎉 *Order Placed Successfully!*\n\n` +
//         `📋 Order #: ${order.orderNumber}\n` +
//         `💰 Total: ₹${order.total}\n` +
//         `💵 Payment: Cash on Delivery\n\n` +
//         `We'll prepare your order right away!\n\n` +
//         `Send *track* to check order status 📦`
//       );

//       // Notify restaurant owner (optional)
//       logger.info(`New order ${order.orderNumber} for restaurant ${restaurant.name}`);

//     } catch (err) {
//       logger.error('Order creation error:', err);
//       await send(phoneNumberId, token, to,
//         `❌ Failed to place order. Please try again or contact the restaurant directly.`
//       );
//     }
//   } else {
//     customer.botSession.cart = [];
//     customer.botSession.step = 'idle';
//     await customer.save();
//     await send(phoneNumberId, token, to,
//       `Order cancelled. Send *menu* to start fresh! 🍽️`
//     );
//   }
// };

// // ── FAQ ───────────────────────────────────────────────────────────────────────
// const sendFAQ = async (restaurant, token, phoneNumberId, to) => {
//   const hours = restaurant.workingHours
//     ?.map(h => `${h.day.charAt(0).toUpperCase() + h.day.slice(1)}: ${h.isOpen ? `${h.open} - ${h.close}` : 'Closed'}`)
//     .join('\n') || 'Contact the restaurant';

//   await send(phoneNumberId, token, to,
//     `❓ *Frequently Asked Questions*\n\n` +
//     `*🕐 Working Hours:*\n${hours}\n\n` +
//     `*📍 Address:*\n${restaurant.address || 'Contact the restaurant'}\n\n` +
//     `*💳 Payment:*\nCash on Delivery\n\n` +
//     `*📞 Contact:*\n${restaurant.phone || 'Message us here'}\n\n` +
//     `*🍽️ Categories:*\n${restaurant.foodCategories?.join(', ') || 'Various'}\n\n` +
//     `Send *menu* to start ordering!`
//   );
// };

// // ── Track Last Order ──────────────────────────────────────────────────────────
// const sendLastOrderStatus = async (restaurant, customer, token, phoneNumberId) => {
//   const to = customer.whatsappNumber;

//   const lastOrder = await Order.findOne({
//     restaurant: restaurant._id,
//     customerNumber: to,
//   }).sort({ createdAt: -1 });

//   if (!lastOrder) {
//     await send(phoneNumberId, token, to,
//       `You haven't placed any orders yet! Send *menu* to order. 🍽️`
//     );
//     return;
//   }

//   const statusEmoji = {
//     pending: '⏳', confirmed: '✅', preparing: '👨‍🍳',
//     ready: '📦', delivered: '🎉', cancelled: '❌',
//   };

//   await send(phoneNumberId, token, to,
//     `📦 *Your Last Order*\n\n` +
//     `Order #: ${lastOrder.orderNumber}\n` +
//     `Status: ${statusEmoji[lastOrder.status] || '⏳'} ${lastOrder.status.toUpperCase()}\n` +
//     `Total: ₹${lastOrder.total}\n` +
//     `Date: ${new Date(lastOrder.createdAt).toLocaleDateString()}\n\n` +
//     `Send *menu* to order again!`
//   );
// };

// module.exports = { handleRestaurantBotMessage };








const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const { MenuCategory, MenuItem } = require('../models/Menu');
const { sendTextMessage, sendListMessage, sendButtonMessage } = require('./whatsappService');
const logger = require('../utils/logger');

/**
 * Handle inbound messages for a restaurant's WhatsApp Business number
 * Called when a CUSTOMER messages the restaurant's number to place an order
 */
const handleRestaurantBotMessage = async (phoneNumberId, senderNumber, messageText, messageType, interactiveReply) => {
  try {
    // Find the WhatsApp config for this phone number ID
    const waConfig = await WhatsAppConfig.findOne({ phoneNumberId }).select('+accessToken');

    if (!waConfig) {
      logger.warn(`No WhatsApp config found for phoneNumberId: ${phoneNumberId}`);
      return;
    }

    if (!waConfig.botEnabled) {
      logger.info(`Bot disabled for phoneNumberId: ${phoneNumberId}`);
      return;
    }

    const restaurant = await Restaurant.findById(waConfig.restaurant);
    if (!restaurant) {
      logger.warn(`Restaurant not found for config: ${waConfig._id}`);
      return;
    }

    if (restaurant.status !== 'active') {
      logger.info(`Restaurant ${restaurant.name} is not active (status: ${restaurant.status})`);
      return;
    }

    // Use restaurant's own token if available, otherwise fall back to platform token
    const token = waConfig.accessToken || process.env.MAIN_ACCESS_TOKEN;

    logger.info(`Restaurant bot: ${restaurant.name} | from: ${senderNumber} | text: ${messageText}`);

    // Get or create customer record
    let customer = await Customer.findOne({ restaurant: restaurant._id, whatsappNumber: senderNumber });
    if (!customer) {
      customer = await Customer.create({
        restaurant: restaurant._id,
        whatsappNumber: senderNumber,
        botSession: { step: 'idle', cart: [], lastActivity: new Date() },
      });
      logger.info(`New customer created for ${restaurant.name}: ${senderNumber}`);
    }

    customer.botSession.lastActivity = new Date();

    // Determine input text from message or interactive reply
    const inputText = interactiveReply?.id || interactiveReply?.title || messageText || '';

    await processCustomerStep(restaurant, customer, waConfig, token, phoneNumberId, inputText, messageType);
  } catch (err) {
    logger.error('Restaurant bot error:', err.message, err.stack);
  }
};

const send = (phoneNumberId, token, to, text) =>
  sendTextMessage(phoneNumberId, token, to, text);

const sendButtons = (phoneNumberId, token, to, body, buttons) =>
  sendButtonMessage(phoneNumberId, token, to, body, buttons);

const sendList = (phoneNumberId, token, to, header, body, footer, btnText, sections) =>
  sendListMessage(phoneNumberId, token, to, header, body, footer, btnText, sections);

const processCustomerStep = async (restaurant, customer, waConfig, token, phoneNumberId, text, messageType) => {
  const { step } = customer.botSession;
  const to = customer.whatsappNumber;
  const lowerText = (text || '').toLowerCase().trim();

  // ── Global Commands (work from any step) ──────────────────────────────────
  if (['hi', 'hello', 'hey', 'start', 'hii', 'menu', ''].includes(lowerText) || step === 'idle') {
    await sendGreeting(restaurant, customer, waConfig, token, phoneNumberId);
    return;
  }

  if (lowerText === 'cart' || text === 'view_cart') {
    await sendCartSummary(restaurant, customer, waConfig, token, phoneNumberId);
    return;
  }

  if (lowerText === 'cancel' || text === 'cancel_order') {
    customer.botSession.cart = [];
    customer.botSession.step = 'idle';
    await customer.save();
    await send(phoneNumberId, token, to, `🛒 Cart cleared! Send *Hi* to start a new order.`);
    return;
  }

  if (['help', 'faq', 'info'].includes(lowerText) || text === 'faq') {
    await sendFAQ(restaurant, customer, waConfig, token, phoneNumberId);
    return;
  }

  // ── Step-based routing ────────────────────────────────────────────────────
  switch (step) {
    case 'browsing_categories':
      await handleCategorySelection(restaurant, customer, waConfig, token, phoneNumberId, text);
      break;
    case 'browsing_items':
      await handleItemAction(restaurant, customer, waConfig, token, phoneNumberId, text);
      break;
    case 'cart_review':
      await handleCartAction(restaurant, customer, waConfig, token, phoneNumberId, text);
      break;
    case 'confirm_order':
      await handleOrderConfirmation(restaurant, customer, waConfig, token, phoneNumberId, text);
      break;
    default:
      await sendGreeting(restaurant, customer, waConfig, token, phoneNumberId);
  }
};

// ── Greeting + Category Menu ──────────────────────────────────────────────────
const sendGreeting = async (restaurant, customer, waConfig, token, phoneNumberId) => {
  const to = customer.whatsappNumber;
  customer.botSession.step = 'browsing_categories';
  customer.botSession.cart = [];
  await customer.save();

  const categories = await MenuCategory.find({
    restaurant: restaurant._id,
    isActive: true,
  }).sort('sortOrder');

  if (categories.length === 0) {
    await send(phoneNumberId, token, to,
      `👋 Welcome to *${restaurant.name}*!\n\n` +
      `We're currently setting up our menu. Please check back soon! 🍽️\n\n` +
      `For inquiries, contact us at: ${restaurant.email || restaurant.phone || 'N/A'}`
    );
    return;
  }

  // Check if restaurant is open
  const now = new Date();
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const today = dayNames[now.getDay()];
  const todayHours = restaurant.workingHours?.find(h => h.day === today);
  const isOpen = todayHours?.isOpen !== false;

  const statusText = isOpen
    ? `🟢 Open now (${todayHours?.open || '9:00'} - ${todayHours?.close || '22:00'})`
    : `🔴 Currently closed`;

  const sections = [{
    title: `${restaurant.name} Menu`,
    rows: categories.map(cat => ({
      id: `cat_${cat._id}`,
      title: cat.name.substring(0, 24),
      description: cat.description?.substring(0, 72) || `Browse ${cat.name} items`,
    })),
  }];

  await sendList(
    phoneNumberId, token, to,
    `🍽️ ${restaurant.name}`,
    `👋 Welcome! ${statusText}\n\nChoose a category to browse our menu.\n\n_Send *cart* to view your cart | *help* for FAQ_`,
    `${categories.length} categories available`,
    'Browse Menu',
    sections
  );
};

// ── Category Selection ────────────────────────────────────────────────────────
const handleCategorySelection = async (restaurant, customer, waConfig, token, phoneNumberId, text) => {
  const to = customer.whatsappNumber;

  if (text === 'menu' || text === 'back') {
    customer.botSession.step = 'browsing_categories';
    await customer.save();
    await sendGreeting(restaurant, customer, waConfig, token, phoneNumberId);
    return;
  }

  if (!text.startsWith('cat_')) {
    await send(phoneNumberId, token, to,
      `Please select a category from the menu, or send *menu* to see all categories.`
    );
    return;
  }

  const categoryId = text.replace('cat_', '');
  const [items, category] = await Promise.all([
    MenuItem.find({ restaurant: restaurant._id, category: categoryId, isAvailable: true }).sort('sortOrder'),
    MenuCategory.findById(categoryId),
  ]);

  if (!items.length) {
    await send(phoneNumberId, token, to,
      `😔 No items available in *${category?.name}* right now.\n\nSend *menu* to browse other categories.`
    );
    return;
  }

  customer.botSession.step = 'browsing_items';
  customer.botSession.currentCategoryId = categoryId;
  await customer.save();

  const sections = [{
    title: category?.name || 'Menu Items',
    rows: items.map(item => ({
      id: `item_${item._id}`,
      title: item.name.substring(0, 24),
      description: `₹${item.price}${item.isVeg ? ' 🟢' : ' 🔴'} — ${(item.description || '').substring(0, 50)}`,
    })),
  }];

  await sendList(
    phoneNumberId, token, to,
    `📂 ${category?.name}`,
    `Select an item to add to your cart:\n\n_🟢 Veg  🔴 Non-Veg_`,
    `Send *menu* to go back`,
    'Select Item',
    sections
  );
};

// ── Item Action ───────────────────────────────────────────────────────────────
const handleItemAction = async (restaurant, customer, waConfig, token, phoneNumberId, text) => {
  const to = customer.whatsappNumber;

  if (text === 'menu' || text === 'back') {
    customer.botSession.step = 'browsing_categories';
    await customer.save();
    await sendGreeting(restaurant, customer, waConfig, token, phoneNumberId);
    return;
  }

  if (text === 'view_cart') {
    await sendCartSummary(restaurant, customer, waConfig, token, phoneNumberId);
    return;
  }

  if (text.startsWith('item_')) {
    const itemId = text.replace('item_', '');
    const item = await MenuItem.findById(itemId);

    if (!item || !item.isAvailable) {
      await send(phoneNumberId, token, to,
        `😔 This item is not available right now.\n\nSend *menu* to browse other items.`
      );
      return;
    }

    // Add to cart or increment quantity
    const existing = customer.botSession.cart.find(c => c.item?.toString() === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      customer.botSession.cart.push({
        item: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
      });
    }

    customer.botSession.step = 'browsing_items';
    await customer.save();

    const cartTotal = customer.botSession.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const cartItems = customer.botSession.cart.length;

    await sendButtons(phoneNumberId, token, to,
      `✅ *${item.name}* added to cart!\n` +
      `💰 Price: ₹${item.price}\n\n` +
      `🛒 Cart: ${cartItems} item(s) | Total: ₹${cartTotal}\n\n` +
      `What would you like to do?`,
      [
        { id: 'view_cart', title: '🛒 View Cart' },
        { id: 'menu', title: '🍽️ More Items' },
      ]
    );
  } else {
    await send(phoneNumberId, token, to,
      `Please select an item from the list, or send *menu* to browse categories.`
    );
  }
};

// ── Cart Summary ──────────────────────────────────────────────────────────────
const sendCartSummary = async (restaurant, customer, waConfig, token, phoneNumberId) => {
  const to = customer.whatsappNumber;
  const cart = customer.botSession.cart;

  if (!cart || cart.length === 0) {
    await send(phoneNumberId, token, to,
      `🛒 Your cart is empty!\n\nSend *Hi* or *menu* to start ordering. 😊`
    );
    return;
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartText = cart
    .map(i => `• ${i.name} × ${i.quantity} = ₹${i.price * i.quantity}`)
    .join('\n');

  customer.botSession.step = 'cart_review';
  await customer.save();

  await sendButtons(phoneNumberId, token, to,
    `🛒 *Your Cart — ${restaurant.name}*\n\n${cartText}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `💰 *Total: ₹${total}*`,
    [
      { id: 'checkout', title: '✅ Place Order' },
      { id: 'menu', title: '➕ Add More Items' },
      { id: 'cancel_order', title: '🗑️ Clear Cart' },
    ]
  );
};

// ── Cart Actions ──────────────────────────────────────────────────────────────
const handleCartAction = async (restaurant, customer, waConfig, token, phoneNumberId, text) => {
  const to = customer.whatsappNumber;

  if (text === 'checkout') {
    customer.botSession.step = 'confirm_order';
    await customer.save();

    const total = customer.botSession.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemCount = customer.botSession.cart.length;

    await sendButtons(phoneNumberId, token, to,
      `📋 *Confirm Your Order*\n\n` +
      `🏪 ${restaurant.name}\n` +
      `🛒 ${itemCount} item(s)\n` +
      `💰 Total: ₹${total}\n\n` +
      `Select payment method:`,
      [
        { id: 'pay_cod', title: '💵 Cash on Delivery' },
        { id: 'pay_cancel', title: '❌ Cancel' },
      ]
    );
  } else if (text === 'menu') {
    customer.botSession.step = 'browsing_categories';
    await customer.save();
    await sendGreeting(restaurant, customer, waConfig, token, phoneNumberId);
  } else {
    await sendCartSummary(restaurant, customer, waConfig, token, phoneNumberId);
  }
};

// ── Order Confirmation ────────────────────────────────────────────────────────
const handleOrderConfirmation = async (restaurant, customer, waConfig, token, phoneNumberId, text) => {
  const to = customer.whatsappNumber;

  if (text === 'pay_cod') {
    try {
      // Create the order
      const order = new Order({
        restaurant: restaurant._id,
        customer: customer._id,
        customerNumber: to,
        items: customer.botSession.cart.map(i => ({
          menuItem: i.item,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: customer.botSession.cart.reduce((s, i) => s + i.price * i.quantity, 0),
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending',
        status: 'pending',
      });
      await order.save();

      // Update restaurant stats
      await Restaurant.findByIdAndUpdate(restaurant._id, {
        $inc: { totalOrders: 1, totalRevenue: order.total },
      });

      // Update customer stats
      customer.totalOrders += 1;
      customer.totalSpent += order.total;
      customer.lastOrderAt = new Date();
      customer.botSession.cart = [];
      customer.botSession.step = 'idle';
      await customer.save();

      // Update menu item order counts
      for (const item of order.items) {
        if (item.menuItem) {
          await MenuItem.findByIdAndUpdate(item.menuItem, {
            $inc: { totalOrdered: item.quantity },
          }).catch(() => {});
        }
      }

      // Send order confirmation to customer
      await send(phoneNumberId, token, to,
        `🎉 *Order Placed Successfully!*\n\n` +
        `📋 Order #: *${order.orderNumber}*\n` +
        `🏪 Restaurant: ${restaurant.name}\n` +
        `💰 Total: ₹${order.total}\n` +
        `💵 Payment: Cash on Delivery\n\n` +
        `⏳ We'll prepare your order right away!\n\n` +
        `_Send *Hi* to place another order 😊_`
      );

      // Notify restaurant owner (if they have their own number configured)
      try {
        const ownerConfig = await WhatsAppConfig.findOne({
          restaurant: restaurant._id,
        }).select('+accessToken');

        if (ownerConfig && ownerConfig.phoneNumberId !== phoneNumberId) {
          // Restaurant has a different owner notification number
          // For now, we use the main bot to notify
        }

        // Notify via main bot to the restaurant owner's personal WhatsApp
        const { sendFromMainBot } = require('./whatsappService');
        const populatedRestaurant = await Restaurant.findById(restaurant._id).populate('owner');
        if (populatedRestaurant?.owner?.whatsappNumber) {
          await sendFromMainBot(
            populatedRestaurant.owner.whatsappNumber,
            `🔔 *New Order Alert!*\n\n` +
            `📋 Order #: ${order.orderNumber}\n` +
            `👤 Customer: ${to}\n` +
            `🛒 Items: ${order.items.length}\n` +
            `💰 Total: ₹${order.total}\n\n` +
            `📊 Manage at: ${process.env.FRONTEND_URL}/dashboard/orders`
          ).catch(() => {});
        }
      } catch (err) {
        logger.warn('Owner notification failed:', err.message);
      }

      logger.info(`Order created: ${order.orderNumber} for restaurant: ${restaurant.name}`);

    } catch (err) {
      logger.error('Order creation error:', err);
      await send(phoneNumberId, token, to,
        `❌ Failed to place your order. Please try again.\n\nSend *Hi* to start over.`
      );
    }

  } else {
    // Cancelled
    customer.botSession.cart = [];
    customer.botSession.step = 'idle';
    await customer.save();
    await send(phoneNumberId, token, to,
      `Order cancelled. Send *Hi* to start a new order! 🍽️`
    );
  }
};

// ── FAQ ───────────────────────────────────────────────────────────────────────
const sendFAQ = async (restaurant, customer, waConfig, token, phoneNumberId) => {
  const to = customer.whatsappNumber;

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const today = dayNames[new Date().getDay()];
  const todayHours = restaurant.workingHours?.find(h => h.day === today);
  const hoursText = todayHours?.isOpen
    ? `Today: ${todayHours.open} - ${todayHours.close}`
    : 'Closed today';

  await send(phoneNumberId, token, to,
    `❓ *${restaurant.name} — FAQ*\n\n` +
    `🕐 *Hours Today:*\n${hoursText}\n\n` +
    `📍 *Address:*\n${restaurant.address || 'Contact us for address'}\n\n` +
    `📧 *Email:*\n${restaurant.email || 'N/A'}\n\n` +
    `💳 *Payment:*\nCash on Delivery\n\n` +
    `🍽️ *We serve:*\n${restaurant.foodCategories?.join(', ') || 'Various cuisines'}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `Send *Hi* to start ordering!\n` +
    `Send *cart* to view your cart\n` +
    `Send *cancel* to clear cart`
  );
};

module.exports = { handleRestaurantBotMessage };