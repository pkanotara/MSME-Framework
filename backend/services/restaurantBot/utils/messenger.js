const axios = require("axios");
const {
  sendTextMessage,
  sendListMessage,
  sendButtonMessage,
} = require("../../whatsappService");

const send = (ctx, text) =>
  sendTextMessage(ctx.phoneNumberId, ctx.token, ctx.to, text);

const sendBtn = (ctx, body, buttons) =>
  sendButtonMessage(ctx.phoneNumberId, ctx.token, ctx.to, body, buttons);

const sendList = (ctx, header, body, footer, btnText, sections) =>
  sendListMessage(
    ctx.phoneNumberId,
    ctx.token,
    ctx.to,
    header,
    body,
    footer,
    btnText,
    sections,
  );

// ✅ add `caption`
const sendImageByLink = async (ctx, link, caption = "") => {
  const GRAPH_BASE = `https://graph.facebook.com/${
    process.env.META_GRAPH_API_VERSION || "v19.0"
  }`;

  const payload = {
    messaging_product: "whatsapp",
    to: ctx.to,
    type: "image",
    image: { link },
  };

  if (caption && caption.trim()) {
    payload.image.caption = caption.trim();
  }

  await axios.post(`${GRAPH_BASE}/${ctx.phoneNumberId}/messages`, payload, {
    headers: { Authorization: `Bearer ${ctx.token}` },
  });
};

module.exports = { send, sendBtn, sendList, sendImageByLink };