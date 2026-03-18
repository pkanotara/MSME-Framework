import { Request } from 'express';
import { UserRole } from './roles';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    restaurantId?: string;
  };
}
