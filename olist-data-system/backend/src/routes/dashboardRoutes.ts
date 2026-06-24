import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();

// Overview is viewable by all authenticated roles
router.get('/overview', authenticateToken, dashboardController.getOverview);

// Customers and Products are only accessible by Admins and Analysts
router.get('/customers', authenticateToken, requireRoles(['Admin', 'Business Analyst']), dashboardController.getCustomers);
router.get('/products', authenticateToken, requireRoles(['Admin', 'Business Analyst']), dashboardController.getProducts);

// Orders, Sellers, and Reviews can also be managed by Seller Managers
router.get('/orders', authenticateToken, requireRoles(['Admin', 'Business Analyst', 'Seller Manager']), dashboardController.getOrders);
router.get('/sellers', authenticateToken, requireRoles(['Admin', 'Business Analyst', 'Seller Manager']), dashboardController.getSellers);
router.get('/reviews', authenticateToken, requireRoles(['Admin', 'Business Analyst', 'Seller Manager']), dashboardController.getReviews);

export default router;
