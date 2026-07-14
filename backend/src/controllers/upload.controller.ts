import { Request, Response } from 'express';
import { cloudinary, deleteImage as cloudinaryDelete } from '../config/cloudinary';
import { AppError } from '../middlewares/errorHandler';

export const uploadImages = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const { type = 'complaint' } = req.body;

  if (!files || files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const uploadPromises = files.map(file => {
    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `hosteldesk/${type}`,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
          width: 1200,
          crop: 'limit',
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(file.buffer);
    });
  });

  const results = await Promise.all(uploadPromises);

  res.status(200).json({ success: true, data: results });
};

export const deleteImage = async (req: Request, res: Response) => {
  const { publicId } = req.params;
  const decodedPublicId = decodeURIComponent(publicId);
  await cloudinaryDelete(decodedPublicId);
  res.status(200).json({ success: true, message: 'Image deleted' });
};
