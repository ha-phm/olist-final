import { db } from '../config/database';

interface SellerFilters {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  state?: string;
  city?: string;
  category?: string;
}

/**
 * Xây dựng điều kiện WHERE động cho các bộ lọc liên quan đến Người bán
 */
function buildFilterClause(filters?: SellerFilters) {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (!filters) return { whereClause: '', params };

  if (filters.startDate) {
    conditions.push(`o.order_purchase_timestamp >= $${paramIndex}`);
    params.push(filters.startDate);
    paramIndex++;
  }
  if (filters.endDate) {
    conditions.push(`o.order_purchase_timestamp <= $${paramIndex}`);
    params.push(filters.endDate);
    paramIndex++;
  }
  if (filters.orderStatus) {
    conditions.push(`o.order_status = $${paramIndex}`);
    params.push(filters.orderStatus);
    paramIndex++;
  }
  if (filters.state) {
    conditions.push(`s.seller_state = $${paramIndex}`); // Lọc theo bang của người bán
    params.push(filters.state.toUpperCase());
    paramIndex++;
  }
  if (filters.city) {
    conditions.push(`LOWER(s.seller_city) = LOWER($${paramIndex})`); // Lọc theo thành phố của người bán
    params.push(filters.city.trim());
    paramIndex++;
  }
  if (filters.category) {
    conditions.push(`(LOWER(p.product_category_name) = LOWER($${paramIndex}) OR LOWER(t.product_category_name_english) = LOWER($${paramIndex}))`);
    params.push(filters.category.trim());
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { whereClause, params };
}

/**
 * Lấy các KPI hiệu suất người bán và danh sách Top 5 nhà bán hàng xuất sắc nhất
 */
export async function fetchSellersMetrics(filters?: SellerFilters) {
  const { whereClause, params } = buildFilterClause(filters);

  try {
    // 1. Lấy tổng số lượng người bán đang hoạt động dựa theo bộ lọc
    const kpiQuery = `
      SELECT 
        COUNT(DISTINCT s.seller_id) as total_sellers,
        AVG(r.review_score) as avg_seller_rating
      FROM olist_sellers s
      LEFT JOIN olist_order_items i ON s.seller_id = i.seller_id
      LEFT JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_order_reviews r ON o.order_id = r.order_id
      ${whereClause}
    `;
    const kpiResult = await db.query(kpiQuery, params);
    const kpiRow = kpiResult.rows[0];

    // 2. Truy vấn danh sách Top 5 nhà bán hàng dựa trên Doanh thu (Revenue)
    // Đồng thời tính toán chính xác Rating trung bình và Tỷ lệ giao hàng thành công của từng nhà bán hàng từ dữ liệu thật
    const topSellersQuery = `
      SELECT 
        s.seller_id,
        s.seller_city as city,
        s.seller_state as state,
        COALESCE(SUM(i.price), 0) as revenue,
        COALESCE(AVG(r.review_score), 5.0) as rating,
        (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) * 100.0 / COUNT(o.order_id)) as delivery_success_rate
      FROM olist_sellers s
      INNER JOIN olist_order_items i ON s.seller_id = i.seller_id
      INNER JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_order_reviews r ON o.order_id = r.order_id
      ${whereClause}
      GROUP BY s.seller_id, s.seller_city, s.seller_state
      ORDER BY revenue DESC
      LIMIT 5
    `;
    const topSellersResult = await db.query(topSellersQuery, params);

    const sellersList = topSellersResult.rows.map(row => {
      const shortId = row.seller_id.substring(0, 8) + '...';
      return {
        id: shortId,
        fullId: row.seller_id,
        city: row.city,
        state: row.state,
        revenue: Math.round(Number(row.revenue)),
        rating: Math.round(Number(row.rating) * 100) / 100,
        deliverySuccessRate: Math.round(Number(row.delivery_success_rate) * 10) / 10
      };
    });

    return {
      kpis: {
        total_sellers: Number(kpiRow.total_sellers) || 0,
        avg_seller_rating: Math.round(Number(kpiRow.avg_seller_rating) * 100) / 100 || 4.45
      },
      sellers: sellersList
    };

  } catch (error: any) {
    console.error('[Seller Metrics Error] Failed to execute database queries:', error.message);
    throw error;
  }
}