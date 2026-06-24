import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Import trực tiếp từ file orderQueries.ts thay vì db_queries cũ
import { searchOlistOrders, getOrderDetailsData } from '../models/orderQueries';

export const orderController = {
  /**
   * Search and listing orders with complex queries on customers & payment methods
   */
  async searchOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const { q } = req.query;
      const orderRows = await searchOlistOrders(q as string);
      
      return res.json({
        results: orderRows,
        count: orderRows.length
      });
    } catch (err: any) {
      console.error('Search orders error:', err);
      return res.status(500).json({ error: 'Tìm kiếm đơn hàng thất bại.' });
    }
  },

  /**
   * Get single order details including products, payments, reviews
   */
  async getOrderDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // Gọi thẳng xuống DB để lấy object chi tiết
      const orderDetails = await getOrderDetailsData(id);

      if (!orderDetails) {
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng mong muốn.' });
      }

      return res.json(orderDetails);
      
    } catch (err: any) {
      console.error('Get order details error:', err);
      return res.status(500).json({ error: 'Truy xuất chi tiết đơn hàng thất bại.' });
    }
  }
};