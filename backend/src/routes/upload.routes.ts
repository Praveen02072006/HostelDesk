import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { uploadImages, deleteImage } from '../controllers/upload.controller';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

export const uploadRouter = Router();
uploadRouter.use(authenticate);
uploadRouter.post('/', upload.array('images', 10), uploadImages);
uploadRouter.delete('/:publicId', deleteImage);
