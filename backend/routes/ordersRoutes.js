import express from 'express';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../controllers/orderController.js';

const router = express.Router();

router.get('/pedidos', getAllOrders);
router.put('/pedidos/:idpedido', updateOrderStatus);
router.delete('/pedidos/:idpedido', deleteOrder);

export default router;