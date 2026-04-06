const { send, sendBtn } = require("../utils/messenger");

const startGreeting = async (ctx) => {
  const { restaurant, customer } = ctx;

  // Returning user with cart
  if (
    (customer.botSession?.cart?.length || 0) > 0 &&
    (customer.totalOrders || 0) > 0
  ) {
    const cartCount = customer.botSession.cart.length;
    customer.botSession.step = "main_menu";
    await customer.save();

    await sendBtn(
      ctx,
      `Welcome back 👋\n\nYou still have *${cartCount} item(s)* in your cart 😏\n\nWhat would you like to do?`,
      [
        { id: "view_cart", title: "🛒 Continue Order" },
        { id: "clear_cart", title: "🔄 Start Fresh" },
      ],
    );
    return;
  }

  const name = customer.name;
  customer.botSession.step = "greeting";
  customer.botSession.cart = [];
  await customer.save();

  if (name) {
    await sendBtn(
      ctx,
      `Hey 👋 Welcome back to *${restaurant.name}*\n\nContinue as *${name}*?`,
      [
        { id: "confirm_name", title: "✅ Yes" },
        { id: "change_name", title: "✏️ Change" },
      ],
    );
    return;
  }

  await send(ctx, `Hey 👋 Welcome to *${restaurant.name}*!\n\nWhat's your name? 😊`);
  customer.botSession.step = "name_change";
  await customer.save();
};

const handleGreetingReply = async (ctx) => {
  const { inputText, customer } = ctx;

  if (inputText === "confirm_name") {
    const mainMenu = require("./mainMenu");
    return mainMenu.showMainMenu(ctx);
  }

  if (inputText === "change_name") {
    customer.botSession.step = "name_change";
    await customer.save();
    await send(ctx, `What would you like me to call you? ✏️`);
    return;
  }

  return handleNameChange(ctx);
};

const handleNameChange = async (ctx) => {
  const { inputText, customer } = ctx;

  const blockedIds = new Set([
    "order_food",
    "view_cart",
    "checkout_start",
    "track_order",
    "confirm_name",
    "change_name",
    "more_items",
    "main_menu",
    "clear_cart",
  ]);

  const raw = (inputText || "").trim();

  if (blockedIds.has(raw)) {
    await send(ctx, `🙂 Please type your name (example: Pravin).`);
    return;
  }

  const bad = ["hi", "hello", "hey", "hii", "start", "restart", "menu"];

  if (!raw || raw.length < 2 || bad.includes(raw.toLowerCase())) {
    await send(ctx, `🙂 Please enter your real name (example: Pravin).`);
    return;
  }

  customer.name = raw;
  customer.botSession.step = "greeting";
  await customer.save();

  await sendBtn(ctx, `Nice to meet you, *${customer.name}*! 🎉`, [
    { id: "confirm_name", title: "✅ Continue" },
  ]);
};

module.exports = {
  startGreeting,
  handleGreetingReply,
  handleNameChange,
};