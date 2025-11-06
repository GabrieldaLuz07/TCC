import express from 'express';
import {
  generatePix,
  getAvailability,
  getPublicProducts,
  createOrder,
  getCakeSizes,
  getCakeDoughs,
  getCakeFillings,
  getCakeFrostings
} from '../controllers/publicController.js';

const router = express.Router();

router.post('/pix', generatePix);
router.get('/availability', getAvailability);
router.get('/produtos', getPublicProducts);
router.post('/pedidos', createOrder);

router.get('/tamanhosbolo', getCakeSizes);
router.get('/massasbolo', getCakeDoughs);
router.get('/recheiosbolo', getCakeFillings);
router.get('/coberturasbolo', getCakeFrostings);

export default router;