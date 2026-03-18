import { v2 as cloudinary } from 'cloudinary';
import { Request, Response } from 'express';
import { env } from '../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

export const uploadImageByUrl = async (req: Request, res: Response): Promise<void> => {
  const { imageUrl, folder } = req.body as { imageUrl: string; folder?: string };
  const result = await cloudinary.uploader.upload(imageUrl, { folder: folder ?? 'foodiehub' });
  res.json({ secureUrl: result.secure_url, publicId: result.public_id });
};
