/**
 * Normalize a phone number to digits only with country code
 * e.g. "+91 98765 43210" → "919876543210"
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
};

/**
 * Basic phone validation - must be 7-15 digits, with optional leading +
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = normalizePhone(phone);
  return cleaned.length >= 7 && cleaned.length <= 15;
};

module.exports = { normalizePhone, isValidPhone };
