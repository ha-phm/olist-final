import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Import trực tiếp từ các file SQL model mới tạo
import { getCategoriesList } from '../models/productQueries';
import { getLocationsList } from '../models/customerQueries';

export const productController = {
  /**
   * Get all unique categories list for filters
   */
  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await getCategoriesList();
      return res.json(categories);
    } catch (err: any) {
      console.error('Get categories error:', err);
      return res.status(500).json({ error: 'Truy xuất danh mục thất bại.' });
    }
  },

  /**
   * Get list of geological locations for filter selectors
   */
  async getLocations(_req: AuthenticatedRequest, res: Response) {
    try {
      const locations = await getLocationsList();
      return res.json(locations);
    } catch (err: any) {
      console.error('Get locations error:', err);
      return res.status(500).json({ error: 'Truy xuất vị trí địa lý thất bại.' });
    }
  }
};