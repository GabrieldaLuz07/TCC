import express from 'express';
import {
  getSettings,
  updateSettings
} from '../controllers/settingsController.js';

const router = express.Router();

router.get('/configuracoes', getSettings);
router.put('/configuracoes', updateSettings);

export default router;