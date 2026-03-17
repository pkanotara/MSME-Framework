import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest } from '../types/express';
import { ApiError } from '../utils/apiError';

export const authGuard = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new ApiError(401, 'Unauthorized');

  const token = auth.replace('Bearer ', '');
  const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: 'admin' | 'staff' };
  req.user = payload;
  next();
};
