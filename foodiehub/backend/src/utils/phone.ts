import { ApiError } from './apiError';

export const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/[^\d+]/g, '');
  const normalized = digits.startsWith('+') ? digits : `+${digits}`;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new ApiError(400, 'Invalid phone number format. Use international format e.g. +14155550123');
  }
  return normalized;
};
