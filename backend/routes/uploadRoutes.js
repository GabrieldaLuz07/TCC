import express from 'express';
import {
  uploadMiddleware,
  uploadImage
} from '../controllers/uploadController.js';

const router = express.Router();

router.post('/upload', uploadMiddleware.single('image'), uploadImage);

export default router;