import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest } from '../types/express';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../types/roles';

export const authGuard = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new ApiError(401, 'Unauthorized');

  const token = auth.replace('Bearer ', '');
  const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: UserRole; restaurantId?: string };
  req.user = payload;
  next();
};

export const requireRoles = (...allowedRoles: UserRole[]) => (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  if (!allowedRoles.includes(req.user.role)) throw new ApiError(403, 'Forbidden');
  next();
};
