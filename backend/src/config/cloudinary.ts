import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const UPLOAD_PRESETS = {
  COMPLAINT: 'hosteldesk_complaints',
  BEFORE_REPAIR: 'hosteldesk_before',
  AFTER_REPAIR: 'hosteldesk_after',
  AVATAR: 'hosteldesk_avatars',
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
