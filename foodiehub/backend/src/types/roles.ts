export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  RESTAURANT_OWNER: 'restaurant_owner',
  MANAGER: 'manager'
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
