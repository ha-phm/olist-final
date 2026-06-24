import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Import từ 6 file Models mới
import { fetchOverviewMetrics } from '../models/overviewQueries';
import { fetchCustomersMetrics } from '../models/customerQueries';
import { fetchProductsMetrics } from '../models/productQueries';
import { fetchOrdersMetrics } from '../models/orderQueries';
import { fetchSellersMetrics } from '../models/sellerQueries';
import { fetchReviewsMetrics } from '../models/reviewQueries';

export const dashboardController = {
  /**
   * Get Overview Dashboard data (revenue, monthly sales, growth)
   * Accessible by: All roles (Admin, Analyst, Seller, Viewer)
   */
  async getOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = req.query;
      const data = await fetchOverviewMetrics(filters);
      return res.json(data);
    } catch (err: any) {
      console.error("Overview controller error:", err);
      return res.status(500).json({ error: 'Không thể truy xuất dữ liệu tổng quan.' });
    }
  },

  /**
   * Get Customers Dashboard data (allocations, cities, value)
   * Accessible by: Admin, Business Analyst
   */
  async getCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = req.query;
      const data = await fetchCustomersMetrics(filters);
      return res.json(data);
    } catch (err: any) {
      console.error("Customers controller error:", err);
      return res.status(500).json({ error: 'Không thể truy xuất dữ liệu khách hàng.' });
    }
  },

  /**
   * Get Products Dashboard data (categories, top sold items)
   * Accessible by: Admin, Business Analyst
   */
  async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = req.query;
      const data = await fetchProductsMetrics(filters);
      return res.json(data);
    } catch (err: any) {
      console.error("Products controller error:", err);
      return res.status(500).json({ error: 'Không thể truy xuất dữ liệu sản phẩm.' });
    }
  },

  /**
   * Get Orders Dashboard data (counts, timings, status)
   * Accessible by: Admin, Business Analyst, Seller Manager
   */
  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = req.query;
      const data = await fetchOrdersMetrics(filters);
      return res.json(data);
    } catch (err: any) {
      console.error("Orders controller error:", err);
      return res.status(500).json({ error: 'Không thể truy xuất dữ liệu đơn hàng.' });
    }
  },

  /**
   * Get Sellers Performance data
   * Accessible by: Admin, Business Analyst, Seller Manager
   */
  async getSellers(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = req.query;
      const data = await fetchSellersMetrics(filters);
      return res.json(data);
    } catch (err: any) {
      console.error("Sellers controller error:", err);
      return res.status(500).json({ error: 'Không thể truy xuất dữ liệu người bán.' });
    }
  },

  /**
   * Get Reviews Dashboard data
   * Accessible by: Admin, Business Analyst, Seller Manager
   */
  async getReviews(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = req.query;
      const data = await fetchReviewsMetrics(filters);
      return res.json(data);
    } catch (err: any) {
      console.error("Reviews controller error:", err);
      return res.status(500).json({ error: 'Không thể truy xuất dữ liệu đánh giá.' });
    }
  }
};