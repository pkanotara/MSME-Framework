import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction): void => {
  schema.parse({ body: req.body, params: req.params, query: req.query });
  next();
};
