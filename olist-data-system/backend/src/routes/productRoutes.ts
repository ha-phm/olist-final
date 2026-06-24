import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Filter fields loaded dynamically
router.get('/categories', authenticateToken, productController.getCategories);
router.get('/locations', authenticateToken, productController.getLocations);

export default router;
