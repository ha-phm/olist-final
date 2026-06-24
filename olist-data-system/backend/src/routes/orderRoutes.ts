import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/search', authenticateToken, requireRoles(['Admin', 'Business Analyst', 'Seller Manager']), orderController.searchOrders);
router.get('/:id', authenticateToken, requireRoles(['Admin', 'Business Analyst', 'Seller Manager']), orderController.getOrderDetails);

export default router;
