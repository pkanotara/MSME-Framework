// const Customer = require("../models/Customer");
// const Order = require("../models/Order");
// const Restaurant = require("../models/Restaurant");
// const WhatsAppConfig = require("../models/WhatsAppConfig");
// const { MenuCategory, MenuItem } = require("../models/Menu");
// const {
//   sendTextMessage,
//   sendListMessage,
//   sendButtonMessage,
// } = require("./whatsappService");
// const logger = require("../utils/logger");

// /**
//  * Handle inbound messages for a restaurant's WhatsApp Business number
//  */
// const handleRestaurantBotMessage = async (
//   phoneNumberId,
//   senderNumber,
//   messageText,
//   messageType,
//   interactiveReply,
//   contacts = [],
// ) => {
//   try {
//     const waConfig = await WhatsAppConfig.findOne({
//       phoneNumberId,
//       botEnabled: true,
//       signupStatus: "configured",
//     }).select("+accessToken");

//     if (!waConfig) {
//       logger.warn(`No active bot config for phoneNumberId: ${phoneNumberId}`);
//       return;
//     }

//     const restaurant = await Restaurant.findById(waConfig.restaurant);
//     if (!restaurant || restaurant.status !== "active") return;

//     const token = waConfig.accessToken || process.env.MAIN_ACCESS_TOKEN;

//     // Get or create customer
//     let customer = await Customer.findOne({
//       restaurant: restaurant._id,
//       whatsappNumber: senderNumber,
//     });

//     if (!customer) {
//       customer = await Customer.create({
//         restaurant: restaurant._id,
//         whatsappNumber: senderNumber,
//         botSession: { step: "idle", cart: [], lastActivity: new Date() },
//       });
//     }

//     // ✅ ADD THIS (HERE)
//     const waProfileName = contacts?.[0]?.profile?.name?.trim();
//     if (waProfileName && !customer.name) {
//       customer.name = waProfileName;
//       await customer.save();
//     }

//     customer.botSession.lastActivity = new Date();

//     const inputText =
//       interactiveReply?.id || interactiveReply?.title || messageText || "";

//     await processStep(
//       restaurant,
//       customer,
//       token,
//       phoneNumberId,
//       inputText,
//       messageType,
//     );
//   } catch (err) {
//     logger.error("Restaurant bot error:", err);
//   }
// };

// // ── Helpers ──────────────────────────────────────────────────────────────────
// const send = (pid, token, to, text) => sendTextMessage(pid, token, to, text);

// const sendBtn = (pid, token, to, body, buttons) =>
//   sendButtonMessage(pid, token, to, body, buttons);

// const sendList = (pid, token, to, header, body, footer, btnText, sections) =>
//   sendListMessage(pid, token, to, header, body, footer, btnText, sections);

// // ── Main step processor ───────────────────────────────────────────────────────
// const processStep = async (
//   restaurant,
//   customer,
//   token,
//   pid,
//   text,
//   messageType,
// ) => {
//   const { step } = customer.botSession;
//   const to = customer.whatsappNumber;
//   const lower = (text || "").toLowerCase().trim();

//   // ── Global commands (always available) ──────────────────────────────────────
//   if (["hi", "hello", "hey", "start", "hii", "menu"].includes(lower)) {
//     await startGreeting(restaurant, customer, token, pid);
//     return;
//   }
//   if (text === "main_menu" || lower === "back") {
//     await showMainMenu(restaurant, customer, token, pid);
//     return;
//   }
//   if (text === "view_cart" || lower === "cart") {
//     await showCart(restaurant, customer, token, pid);
//     return;
//   }
//   if (text === "help") {
//     await showHelp(restaurant, customer, token, pid);
//     return;
//   }
//   if (text === "clear_cart") {
//     customer.botSession.cart = [];
//     customer.botSession.step = "main_menu";
//     await customer.save();
//     await sendBtn(
//       pid,
//       token,
//       to,
//       `🗑️ Cart cleared!\n\nWhat would you like to do?`,
//       [
//         { id: "order_food", title: "🍕 Order Food" },
//         { id: "help", title: "📞 Help" },
//       ],
//     );
//     return;
//   }
//   if (text === "cancel_order") {
//     await handleCancelOrder(restaurant, customer, token, pid);
//     return;
//   }

//   // ── Step routing ─────────────────────────────────────────────────────────────
//   switch (step) {
//     case "idle":
//     case "greeting":
//       await handleGreetingReply(restaurant, customer, token, pid, text);
//       break;
//     case "name_change":
//       await handleNameChange(restaurant, customer, token, pid, text);
//       break;
//     case "main_menu":
//       await handleMainMenuReply(restaurant, customer, token, pid, text);
//       break;
//     case "browsing_categories":
//       await handleCategorySelect(restaurant, customer, token, pid, text);
//       break;
//     case "browsing_items":
//       await handleItemBrowse(
//         restaurant,
//         customer,
//         token,
//         pid,
//         text,
//         messageType,
//       );
//       break;
//     case "checkout_address":
//       await handleAddressInput(
//         restaurant,
//         customer,
//         token,
//         pid,
//         text,
//         messageType,
//       );
//       break;
//     case "checkout_confirm":
//       await handleCheckoutConfirm(restaurant, customer, token, pid, text);
//       break;
//     case "checkout_payment":
//       await handlePayment(restaurant, customer, token, pid, text);
//       break;
//     case "track_order":
//       await showTrackOrder(restaurant, customer, token, pid);
//       break;
//     default:
//       await startGreeting(restaurant, customer, token, pid);
//   }
// };

// // ── 1. Entry / Greeting ───────────────────────────────────────────────────────
// const startGreeting = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;

//   // Check if returning user with cart
//   if (customer.botSession.cart?.length > 0 && customer.totalOrders > 0) {
//     const cartCount = customer.botSession.cart.length;
//     customer.botSession.step = "main_menu";
//     await customer.save();

//     await sendBtn(
//       pid,
//       token,
//       to,
//       `Welcome back 👋\n\nYou still have *${cartCount} item(s)* in your cart 😏\n\nWhat would you like to do?`,
//       [
//         { id: "view_cart", title: "🛒 Continue Order" },
//         { id: "clear_cart", title: "🔄 Start Fresh" },
//       ],
//     );
//     return;
//   }

//   // New or returning without cart
//   const name = customer.name;
//   customer.botSession.step = "greeting";
//   customer.botSession.cart = [];
//   await customer.save();

//   if (name) {
//     await sendBtn(
//       pid,
//       token,
//       to,
//       `Hey 👋 Welcome to *${restaurant.name}*\n\nCan I call you *${name}*?`,
//       [
//         { id: "confirm_name", title: "✅ Yes" },
//         { id: "change_name", title: "✏️ Change" },
//       ],
//     );
//   } else {
//     await send(
//       pid,
//       token,
//       to,
//       `Hey 👋 Welcome to *${restaurant.name}*!\n\nWhat's your name? 😊`,
//     );
//     customer.botSession.step = "name_change";
//     await customer.save();
//   }
// };

// // ── 2. Greeting reply ────────────────────────────────────────────────────────
// const handleGreetingReply = async (restaurant, customer, token, pid, text) => {
//   const to = customer.whatsappNumber;

//   if (text === "confirm_name") {
//     await showMainMenu(restaurant, customer, token, pid);
//   } else if (text === "change_name") {
//     customer.botSession.step = "name_change";
//     await customer.save();
//     await send(pid, token, to, `What would you like me to call you? ✏️`);
//   } else {
//     // They typed their name directly
//     await handleNameChange(restaurant, customer, token, pid, text);
//   }
// };

// // ── 3. Name change ───────────────────────────────────────────────────────────
// const handleNameChange = async (restaurant, customer, token, pid, text) => {
//   const to = customer.whatsappNumber;

//   const t = (text || '').trim();
//   const bad = ['hi', 'hello', 'hey', 'hii', 'start', 'restart', 'menu'];

//   if (!t || t.length < 2 || bad.includes(t.toLowerCase())) {
//     await send(pid, token, to, `🙂 Please enter your real name (example: Pravin).`);
//     return;
//   }

//   customer.name = t;
//   customer.botSession.step = 'greeting';
//   await customer.save();

//   await sendBtn(pid, token, to,
//     `Nice to meet you, *${customer.name}*! 🎉`,
//     [{ id: 'confirm_name', title: '✅ Continue' }]
//   );
// };

// // ── 4. Main Menu ─────────────────────────────────────────────────────────────
// const showMainMenu = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;
//   const name = customer.name ? `, ${customer.name}` : "";

//   customer.botSession.step = "main_menu";
//   await customer.save();

//   const cartCount = customer.botSession.cart?.length || 0;
//   const cartLabel = cartCount > 0 ? `🛒 Cart (${cartCount})` : "🛒 View Cart";

//   await sendBtn(pid, token, to, `What are you craving today${name}? 😋`, [
//     { id: "order_food", title: "🍕 Order Food" },
//     { id: "view_cart", title: cartLabel },
//     { id: "track_order", title: "📦 Track Order" },
//   ]);
// };

// // ── 5. Main menu reply ───────────────────────────────────────────────────────
// const handleMainMenuReply = async (restaurant, customer, token, pid, text) => {
//   const to = customer.whatsappNumber;

//   if (text === "order_food") {
//     await showCategories(restaurant, customer, token, pid);
//   } else if (text === "view_cart") {
//     await showCart(restaurant, customer, token, pid);
//   } else if (text === "track_order") {
//     await showTrackOrder(restaurant, customer, token, pid);
//   } else if (text === "help") {
//     await showHelp(restaurant, customer, token, pid);
//   } else {
//     await showMainMenu(restaurant, customer, token, pid);
//   }
// };

// // ── 6. Category Selection ────────────────────────────────────────────────────
// const showCategories = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;
//   const categories = await MenuCategory.find({
//     restaurant: restaurant._id,
//     isActive: true,
//   }).sort("sortOrder");

//   if (categories.length === 0) {
//     await send(
//       pid,
//       token,
//       to,
//       `😔 Menu is being updated. Please check back soon!\n\nSend *menu* to go back.`,
//     );
//     return;
//   }

//   customer.botSession.step = "browsing_categories";
//   await customer.save();

//   const sections = [
//     {
//       title: `${restaurant.name} Menu`,
//       rows: categories.map((cat) => ({
//         id: `cat_${cat._id}`,
//         title: cat.name.substring(0, 24),
//         description: (cat.description || "").substring(0, 72),
//       })),
//     },
//   ];

//   await sendList(
//     pid,
//     token,
//     to,
//     `🍽️ Our Menu`,
//     `Nice 😄 Here's what we have!\n\nSelect a category to browse:`,
//     `Send *cart* anytime to view your cart`,
//     "Browse Menu",
//     sections,
//   );
// };

// // ── 7. Category selected → show items ───────────────────────────────────────
// const handleCategorySelect = async (restaurant, customer, token, pid, text) => {
//   const to = customer.whatsappNumber;

//   if (text === "order_food") {
//     await showCategories(restaurant, customer, token, pid);
//     return;
//   }

//   if (!text.startsWith("cat_")) {
//     await showCategories(restaurant, customer, token, pid);
//     return;
//   }

//   const categoryId = text.replace("cat_", "");
//   const category = await MenuCategory.findById(categoryId);
//   const items = await MenuItem.find({
//     restaurant: restaurant._id,
//     category: categoryId,
//     isAvailable: true,
//   }).sort("sortOrder");

//   if (items.length === 0) {
//     await sendBtn(
//       pid,
//       token,
//       to,
//       `😔 No items available in *${category?.name}* right now.`,
//       [
//         { id: "order_food", title: "🍕 Browse Menu" },
//         { id: "view_cart", title: "🛒 View Cart" },
//       ],
//     );
//     return;
//   }

//   // Store items list and current index for browsing
//   customer.botSession.step = "browsing_items";
//   customer.botSession.currentCategoryId = categoryId;
//   customer.botSession.currentCategoryName = category?.name || "Items";
//   customer.botSession.itemsList = items.map((i) => i._id.toString());
//   customer.botSession.currentItemIndex = 0;
//   await customer.save();

//   await showItem(restaurant, customer, token, pid, items[0]);
// };

// // ── 8. Show single item with image ───────────────────────────────────────────
// const showItem = async (restaurant, customer, token, pid, item) => {
//   const to = customer.whatsappNumber;
//   const index = customer.botSession.currentItemIndex || 0;
//   const total = customer.botSession.itemsList?.length || 1;
//   const vegIcon = item.isVeg ? "🟢" : "🔴";

//   // Send image if available
//   if (item.imageUrl) {
//     try {
//       const axios = require("axios");
//       const GRAPH_BASE = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || "v19.0"}`;
//       await axios.post(
//         `${GRAPH_BASE}/${pid}/messages`,
//         {
//           messaging_product: "whatsapp",
//           to,
//           type: "image",
//           image: { link: item.imageUrl },
//         },
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//     } catch (err) {
//       logger.warn("Image send failed:", err.message);
//     }
//   }

//   const buttons = [{ id: `add_${item._id}`, title: "➕ Add to Cart" }];

//   if (index < total - 1) {
//     buttons.push({ id: "next_item", title: "➡️ Next" });
//   }
//   buttons.push({ id: "view_cart", title: "🛒 Cart" });

//   await sendBtn(
//     pid,
//     token,
//     to,
//     `${vegIcon} *${item.name}*\n` +
//       `💰 ₹${item.price}\n\n` +
//       `${item.description || ""}\n\n` +
//       `_Item ${index + 1} of ${total} in ${customer.botSession.currentCategoryName}_`,
//     buttons,
//   );
// };

// // ── 9. Item browsing actions ─────────────────────────────────────────────────
// const handleItemBrowse = async (
//   restaurant,
//   customer,
//   token,
//   pid,
//   text,
//   messageType,
// ) => {
//   const to = customer.whatsappNumber;

//   // Add to cart
//   if (text.startsWith("add_")) {
//     const itemId = text.replace("add_", "");
//     const item = await MenuItem.findById(itemId);
//     if (!item) {
//       await send(pid, token, to, `Item not found. Send *menu* to browse.`);
//       return;
//     }

//     const existing = customer.botSession.cart.find(
//       (c) => c.item?.toString() === itemId,
//     );
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

//     await sendBtn(
//       pid,
//       token,
//       to,
//       `Added to your cart ✅\n\n` +
//         `🛍️ *${item.name}* — ₹${item.price}\n` +
//         `Cart: ${customer.botSession.cart.length} item(s)`,
//       [
//         { id: "order_food", title: "➕ Add More" },
//         { id: "view_cart", title: "🛒 View Cart" },
//         { id: "checkout_start", title: "💳 Checkout" },
//       ],
//     );
//     return;
//   }

//   // Next item
//   if (text === "next_item") {
//     const items = customer.botSession.itemsList || [];
//     const nextIndex = (customer.botSession.currentItemIndex || 0) + 1;

//     if (nextIndex >= items.length) {
//       await sendBtn(pid, token, to, `That's all in this category! 😊`, [
//         { id: "order_food", title: "🍕 Browse More" },
//         { id: "view_cart", title: "🛒 View Cart" },
//       ]);
//       return;
//     }

//     customer.botSession.currentItemIndex = nextIndex;
//     await customer.save();

//     const item = await MenuItem.findById(items[nextIndex]);
//     if (item) await showItem(restaurant, customer, token, pid, item);
//     return;
//   }

//   // Checkout
//   if (text === "checkout_start") {
//     await startCheckout(restaurant, customer, token, pid);
//     return;
//   }

//   // Fallback
//   await showCategories(restaurant, customer, token, pid);
// };

// // ── 10. Cart View ────────────────────────────────────────────────────────────
// const showCart = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;
//   const cart = customer.botSession.cart || [];

//   if (cart.length === 0) {
//     await sendBtn(
//       pid,
//       token,
//       to,
//       `Your cart is empty 🛒\n\nAdd some delicious items!`,
//       [
//         { id: "order_food", title: "🍕 Order Food" },
//         { id: "help", title: "📞 Help" },
//       ],
//     );
//     return;
//   }

//   const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
//   const itemList = cart
//     .map((i) => `• *${i.name}* x${i.quantity} — ₹${i.price * i.quantity}`)
//     .join("\n");

//   customer.botSession.step = "main_menu";
//   await customer.save();

//   await sendBtn(
//     pid,
//     token,
//     to,
//     `Here's your cart 🛒\n\n${itemList}\n\n` +
//       `─────────────────\n` +
//       `💰 *Total: ₹${total}*`,
//     [
//       { id: "order_food", title: "➕ Add More" },
//       { id: "checkout_start", title: "💳 Checkout" },
//       { id: "clear_cart", title: "❌ Clear Cart" },
//     ],
//   );
// };

// // ── 11. Checkout ─────────────────────────────────────────────────────────────
// const startCheckout = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;
//   const cart = customer.botSession.cart || [];

//   if (cart.length === 0) {
//     await showCart(restaurant, customer, token, pid);
//     return;
//   }

//   customer.botSession.step = "checkout_address";
//   await customer.save();

//   await sendBtn(
//     pid,
//     token,
//     to,
//     `Almost done 👍\n\n` +
//       `📍 *Step 1 of 3: Delivery Address*\n\n` +
//       `Where should we deliver?`,
//     [
//       { id: "use_saved_address", title: "📍 Use Saved Address" },
//       { id: "type_address", title: "✏️ Type Address" },
//     ],
//   );
// };

// // ── 12. Address input ────────────────────────────────────────────────────────
// const handleAddressInput = async (
//   restaurant,
//   customer,
//   token,
//   pid,
//   text,
//   messageType,
// ) => {
//   const to = customer.whatsappNumber;

//   if (text === "use_saved_address" && customer.address) {
//     customer.botSession.deliveryAddress = customer.address;
//     await customer.save();
//     await showConfirmDetails(restaurant, customer, token, pid);
//     return;
//   }

//   if (text === "type_address" || text === "use_saved_address") {
//     await send(pid, token, to, `📍 Please type your full delivery address:`);
//     return;
//   }

//   // Location message
//   if (messageType === "location") {
//     customer.botSession.deliveryAddress = "Shared via location pin 📍";
//     await customer.save();
//     await showConfirmDetails(restaurant, customer, token, pid);
//     return;
//   }

//   // Text address
//   if (text && text.length > 5) {
//     customer.botSession.deliveryAddress = text;
//     customer.address = text; // Save for future
//     await customer.save();
//     await showConfirmDetails(restaurant, customer, token, pid);
//     return;
//   }

//   await send(pid, token, to, `Please enter a valid delivery address 📍`);
// };

// // ── 13. Confirm details ──────────────────────────────────────────────────────
// const showConfirmDetails = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;
//   const cart = customer.botSession.cart || [];
//   const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

//   customer.botSession.step = "checkout_confirm";
//   await customer.save();

//   await sendBtn(
//     pid,
//     token,
//     to,
//     `Let me confirm 📋\n\n` +
//       `👤 *Name:* ${customer.name || "Not set"}\n` +
//       `📍 *Address:* ${customer.botSession.deliveryAddress}\n` +
//       `🛒 *Items:* ${cart.length}\n` +
//       `💰 *Total:* ₹${total}`,
//     [
//       { id: "confirm_details", title: "✅ Confirm" },
//       { id: "edit_address", title: "✏️ Edit Address" },
//     ],
//   );
// };

// // ── 14. Checkout confirm ─────────────────────────────────────────────────────
// const handleCheckoutConfirm = async (
//   restaurant,
//   customer,
//   token,
//   pid,
//   text,
// ) => {
//   const to = customer.whatsappNumber;

//   if (text === "edit_address") {
//     customer.botSession.step = "checkout_address";
//     await customer.save();
//     await send(pid, token, to, `📍 Please enter your new delivery address:`);
//     return;
//   }

//   if (text === "confirm_details") {
//     customer.botSession.step = "checkout_payment";
//     await customer.save();

//     const total = customer.botSession.cart.reduce(
//       (s, i) => s + i.price * i.quantity,
//       0,
//     );

//     await sendBtn(
//       pid,
//       token,
//       to,
//       `💰 *Step 3 of 3: Payment*\n\n` +
//         `Total: ₹${total}\n\n` +
//         `How would you like to pay?`,
//       [
//         { id: "pay_cod", title: "💵 Cash on Delivery" },
//         { id: "pay_upi", title: "📲 UPI" },
//       ],
//     );
//     return;
//   }

//   await showCart(restaurant, customer, token, pid);
// };

// // ── 15. Payment ──────────────────────────────────────────────────────────────
// const handlePayment = async (restaurant, customer, token, pid, text) => {
//   const to = customer.whatsappNumber;

//   if (text === "pay_upi") {
//     await sendBtn(
//       pid,
//       token,
//       to,
//       `📲 *UPI Payment*\n\n` +
//         `Send payment to:\n` +
//         `*UPI ID:* ${restaurant.upiId || "Contact restaurant"}\n\n` +
//         `After payment, tap Confirm 👇`,
//       [
//         { id: "pay_cod", title: "✅ Payment Done" },
//         { id: "cancel_order", title: "❌ Cancel" },
//       ],
//     );
//     return;
//   }

//   if (text === "pay_cod" || text === "payment_done") {
//     await placeOrder(
//       restaurant,
//       customer,
//       token,
//       pid,
//       text === "pay_cod" ? "cash_on_delivery" : "upi",
//     );
//     return;
//   }

//   await showCart(restaurant, customer, token, pid);
// };

// // ── 16. Place order ──────────────────────────────────────────────────────────
// const placeOrder = async (restaurant, customer, token, pid, paymentMethod) => {
//   const to = customer.whatsappNumber;

//   try {
//     const order = new Order({
//       restaurant: restaurant._id,
//       customer: customer._id,
//       customerNumber: to,
//       items: customer.botSession.cart.map((i) => ({
//         menuItem: i.item,
//         name: i.name,
//         price: i.price,
//         quantity: i.quantity,
//       })),
//       total: customer.botSession.cart.reduce(
//         (s, i) => s + i.price * i.quantity,
//         0,
//       ),
//       paymentMethod,
//       paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "paid",
//       notes: `Delivery: ${customer.botSession.deliveryAddress || "Not specified"}`,
//     });

//     await order.save();

//     // Update stats
//     await require("../models/Restaurant").findByIdAndUpdate(restaurant._id, {
//       $inc: { totalOrders: 1, totalRevenue: order.total },
//     });

//     // Update customer
//     customer.totalOrders += 1;
//     customer.totalSpent += order.total;
//     customer.lastOrderAt = new Date();
//     customer.botSession.cart = [];
//     customer.botSession.step = "idle";
//     customer.botSession.lastOrderId = order._id.toString();
//     customer.botSession.lastOrderNumber = order.orderNumber;
//     await customer.save();

//     // Update menu item stats
//     for (const item of order.items) {
//       if (item.menuItem) {
//         await MenuItem.findByIdAndUpdate(item.menuItem, {
//           $inc: { totalOrdered: item.quantity },
//         });
//       }
//     }

//     await sendBtn(
//       pid,
//       token,
//       to,
//       `Done 🎉 *Your order is placed!*\n\n` +
//         `📋 Order ID: *${order.orderNumber}*\n` +
//         `💰 Total: ₹${order.total}\n` +
//         `💳 Payment: ${paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : "UPI"}\n` +
//         `⏱️ ETA: 30-45 mins\n\n` +
//         `We'll notify you when your order is ready! 🚀`,
//       [
//         { id: "track_order", title: "📦 Track Order" },
//         { id: "order_food", title: "🔁 Order Again" },
//       ],
//     );
//   } catch (err) {
//     logger.error("Order placement error:", err);
//     await sendBtn(
//       pid,
//       token,
//       to,
//       `❌ Something went wrong placing your order.\nPlease try again!`,
//       [
//         { id: "view_cart", title: "🛒 Try Again" },
//         { id: "help", title: "📞 Help" },
//       ],
//     );
//   }
// };

// // ── 17. Track order ───────────────────────────────────────────────────────────
// const showTrackOrder = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;

//   const lastOrder = await Order.findOne({
//     restaurant: restaurant._id,
//     customerNumber: to,
//   }).sort({ createdAt: -1 });

//   if (!lastOrder) {
//     await sendBtn(
//       pid,
//       token,
//       to,
//       `📦 No recent orders found.\n\nPlace your first order!`,
//       [
//         { id: "order_food", title: "🍕 Order Now" },
//         { id: "main_menu", title: "🏠 Main Menu" },
//       ],
//     );
//     return;
//   }

//   const statusMap = {
//     pending: "⏳ Order received",
//     confirmed: "✅ Order confirmed",
//     preparing: "👨‍🍳 Being prepared",
//     ready: "📦 Ready for pickup/delivery",
//     delivered: "🎉 Delivered!",
//     cancelled: "❌ Cancelled",
//   };

//   const progress = {
//     pending: "⏳ Received → ⬜ Preparing → ⬜ On the way → ⬜ Delivered",
//     confirmed: "✅ Received → ⏳ Preparing → ⬜ On the way → ⬜ Delivered",
//     preparing: "✅ Received → 👨‍🍳 Preparing → ⬜ On the way → ⬜ Delivered",
//     ready: "✅ Received → ✅ Prepared → 🚀 On the way → ⬜ Delivered",
//     delivered: "✅ Received → ✅ Prepared → ✅ Delivered → 🎉 Enjoy!",
//     cancelled: "❌ Order was cancelled",
//   };

//   customer.botSession.step = "main_menu";
//   await customer.save();

//   await sendBtn(
//     pid,
//     token,
//     to,
//     `📦 *Order Tracking*\n\n` +
//       `Order: *${lastOrder.orderNumber}*\n` +
//       `Status: *${statusMap[lastOrder.status] || lastOrder.status}*\n\n` +
//       `${progress[lastOrder.status] || ""}\n\n` +
//       `Total: ₹${lastOrder.total}`,
//     [
//       { id: "main_menu", title: "🏠 Main Menu" },
//       { id: "order_food", title: "🔁 Order Again" },
//     ],
//   );
// };

// // ── 18. Cancel order ──────────────────────────────────────────────────────────
// const handleCancelOrder = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;

//   const lastOrder = await Order.findOne({
//     restaurant: restaurant._id,
//     customerNumber: to,
//     status: { $in: ["pending", "confirmed"] },
//   }).sort({ createdAt: -1 });

//   if (!lastOrder) {
//     await sendBtn(pid, token, to, `No active orders to cancel.`, [
//       { id: "order_food", title: "🍕 Order Food" },
//       { id: "main_menu", title: "🏠 Main Menu" },
//     ]);
//     return;
//   }

//   lastOrder.status = "cancelled";
//   lastOrder.statusHistory.push({ status: "cancelled", changedBy: "customer" });
//   await lastOrder.save();

//   customer.botSession.step = "idle";
//   await customer.save();

//   await sendBtn(
//     pid,
//     token,
//     to,
//     `❌ Order *${lastOrder.orderNumber}* has been cancelled.\n\nWe hope to see you again soon!`,
//     [
//       { id: "order_food", title: "🍕 Order Again" },
//       { id: "main_menu", title: "🏠 Main Menu" },
//     ],
//   );
// };

// // ── 19. Help ──────────────────────────────────────────────────────────────────
// const showHelp = async (restaurant, customer, token, pid) => {
//   const to = customer.whatsappNumber;
//   customer.botSession.step = "main_menu";
//   await customer.save();

//   await sendBtn(
//     pid,
//     token,
//     to,
//     `Need help? I'm here 👍\n\n` +
//       `📍 *Address:* ${restaurant.address || "Contact us"}\n` +
//       `📧 *Email:* ${restaurant.email || "Contact us"}\n` +
//       `🕐 *Hours:* Check our profile\n\n` +
//       `What do you need?`,
//     [
//       { id: "cancel_order", title: "❌ Cancel Order" },
//       { id: "main_menu", title: "🏠 Main Menu" },
//       { id: "order_food", title: "🍕 Order Food" },
//     ],
//   );
// };

// module.exports = { handleRestaurantBotMessage };

