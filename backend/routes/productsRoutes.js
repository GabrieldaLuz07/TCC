import express from 'express';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

router.get('/produtos', getAllProducts);
router.post('/produtos', createProduct);
router.put('/produtos/:idproduto', updateProduct);
router.delete('/produtos/:idproduto', deleteProduct);

export default router;