import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signToken = (payload: object): string => jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
