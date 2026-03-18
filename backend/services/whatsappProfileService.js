const axios = require('axios');
const logger = require('../utils/logger');

const GRAPH_BASE = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v19.0'}`;

/**
 * Update WhatsApp Business Profile with restaurant details
 */
const updateWhatsAppBusinessProfile = async (phoneNumberId, accessToken, restaurantData) => {
  logger.info(`Updating WhatsApp Business Profile for phoneNumberId: ${phoneNumberId}`);

  const results = { profile: null, photo: null, errors: [] };

  // ── Step 1: Update Business Profile Fields ──────────────────────────────────
  try {
    const profilePayload = buildProfilePayload(restaurantData);
    logger.info('Profile payload:', JSON.stringify(profilePayload));

    const response = await axios.post(
      `${GRAPH_BASE}/${phoneNumberId}/whatsapp_business_profile`,
      profilePayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    results.profile = response.data;
    logger.info('WhatsApp Business Profile updated successfully:', response.data);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    logger.error('Profile update failed:', JSON.stringify(err.response?.data) || err.message);
    results.errors.push({ step: 'profile_update', error: errMsg });
  }

  // ── Step 2: Update Profile Photo ────────────────────────────────────────────
  if (restaurantData.logoUrl) {
    try {
      await updateProfilePhoto(phoneNumberId, accessToken, restaurantData.logoUrl);
      results.photo = 'updated';
      logger.info('Profile photo updated successfully');
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      logger.warn('Profile photo update failed:', errMsg);
      results.errors.push({ step: 'photo_update', error: errMsg });
    }
  }

  return results;
};

/**
 * Build profile payload from restaurant data
 */
const buildProfilePayload = (restaurant) => {
  const payload = {
    messaging_product: 'whatsapp',
    vertical: 'RESTAURANT',
  };

  // About — short description shown under name (max 139 chars)
  if (restaurant.description) {
    payload.about = restaurant.description.substring(0, 139);
  }

  // Address
  if (restaurant.address) {
    payload.address = restaurant.address.substring(0, 256);
  }

  // Full description with hours and categories (max 512 chars)
  if (restaurant.description) {
    let fullDesc = restaurant.description;

    if (restaurant.workingHours && restaurant.workingHours.length > 0) {
      const hoursText = formatWorkingHours(restaurant.workingHours);
      fullDesc += `\n\n🕐 Hours:\n${hoursText}`;
    }

    if (restaurant.foodCategories && restaurant.foodCategories.length > 0) {
      fullDesc += `\n\n🍽️ We serve: ${restaurant.foodCategories.join(', ')}`;
    }

    payload.description = fullDesc.substring(0, 512);
  }

  // Email
  if (restaurant.email) {
    payload.email = restaurant.email;
  }

  // Website — use dashboard URL
  const website = `${process.env.FRONTEND_URL}/menu/${restaurant._id || restaurant.id || ''}`;
  payload.websites = [website];

  return payload;
};

/**
 * Format working hours
 */
const formatWorkingHours = (workingHours) => {
  const dayNames = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  };

  return workingHours
    .map(h => {
      if (!h.isOpen) return `${dayNames[h.day] || h.day}: Closed`;
      return `${dayNames[h.day] || h.day}: ${h.open} - ${h.close}`;
    })
    .join('\n');
};

/**
 * Update profile photo using resumable upload
 */
const updateProfilePhoto = async (phoneNumberId, accessToken, imageUrl) => {
  logger.info(`Updating profile photo from: ${imageUrl}`);

  // Download image
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(imageResponse.data);
  const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
  const fileSize = imageBuffer.length;

  logger.info(`Image: ${fileSize} bytes, type: ${contentType}`);

  // Create upload session
  const sessionResponse = await axios.post(
    `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v19.0'}/app/uploads`,
    null,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { file_length: fileSize, file_type: contentType },
    }
  );

  const uploadSessionId = sessionResponse.data.id;
  logger.info(`Upload session: ${uploadSessionId}`);

  // Upload image bytes
  const uploadResponse = await axios.post(
    `https://graph.facebook.com/${uploadSessionId}`,
    imageBuffer,
    {
      headers: {
        Authorization: `OAuth ${accessToken}`,
        'Content-Type': contentType,
        'file_offset': '0',
      },
    }
  );

  const uploadHandle = uploadResponse.data.h;
  logger.info(`Upload handle: ${uploadHandle}`);

  // Set profile photo
  await axios.post(
    `${GRAPH_BASE}/${phoneNumberId}/whatsapp_business_profile`,
    {
      messaging_product: 'whatsapp',
      profile_picture_handle: uploadHandle,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  logger.info('Profile photo set successfully');
};

/**
 * Get current WhatsApp Business Profile from Meta
 */
const getWhatsAppBusinessProfile = async (phoneNumberId, accessToken) => {
  const response = await axios.get(
    `${GRAPH_BASE}/${phoneNumberId}/whatsapp_business_profile`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        fields: 'about,address,description,email,profile_picture_url,websites,vertical',
      },
    }
  );
  return response.data.data?.[0] || response.data;
};

/**
 * Full profile setup — called after activation
 */
const setupFullBusinessProfile = async (restaurant, phoneNumberId, accessToken) => {
  logger.info(`Setting up WhatsApp Business Profile for: ${restaurant.name}`);

  const restaurantData = {
    _id: restaurant._id,
    name: restaurant.name,
    description: restaurant.description,
    address: restaurant.address,
    email: restaurant.email,
    logoUrl: restaurant.logoUrl,
    workingHours: restaurant.workingHours,
    foodCategories: restaurant.foodCategories,
    phone: restaurant.phone,
  };

  return await updateWhatsAppBusinessProfile(phoneNumberId, accessToken, restaurantData);
};

module.exports = {
  updateWhatsAppBusinessProfile,
  getWhatsAppBusinessProfile,
  setupFullBusinessProfile,
  buildProfilePayload,
  formatWorkingHours,
};