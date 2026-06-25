import { db } from '../config/database';

interface SellerFilters {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  state?: string;
  city?: string;
  category?: string;
}

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
    conditions.push(`s.seller_state = $${paramIndex}`);
    params.push(filters.state.toUpperCase());
    paramIndex++;
  }
  if (filters.city) {
    conditions.push(`LOWER(s.seller_city) = LOWER($${paramIndex})`);
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

export async function fetchSellersMetrics(filters?: SellerFilters) {
  const { whereClause, params } = buildFilterClause(filters);

  try {
    // 1. KPI tổng quan
    const kpiQuery = `
      SELECT 
        COUNT(DISTINCT s.seller_id) as total_sellers,
        AVG(r.review_score) as avg_seller_rating
      FROM olist_sellers s
      LEFT JOIN olist_order_items i ON s.seller_id = i.seller_id
      LEFT JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN olist_category_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_order_reviews r ON o.order_id = r.order_id
      ${whereClause}
    `;
    const kpiResult = await db.query(kpiQuery, params);
    const kpiRow = kpiResult.rows[0];

    // 2. Lấy danh sách đối tác
    const allSellersQuery = `
      SELECT 
        s.seller_id,
        s.seller_city as city,
        s.seller_state as state,
        COALESCE(SUM(i.price), 0) as revenue,
        COALESCE(AVG(r.review_score), 5.0) as rating,
        (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) * 100.0 / NULLIF(COUNT(o.order_id), 0)) as delivery_success_rate
      FROM olist_sellers s
      INNER JOIN olist_order_items i ON s.seller_id = i.seller_id
      INNER JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN olist_category_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_order_reviews r ON o.order_id = r.order_id
      ${whereClause}
      GROUP BY s.seller_id, s.seller_city, s.seller_state
      ORDER BY revenue DESC
      LIMIT 2000
    `;
    const allSellersResult = await db.query(allSellersQuery, params);

    // 3. Phân bố kho hàng theo Bang
    const geoQuery = `
      SELECT s.seller_state as state, COUNT(DISTINCT s.seller_id) as count
      FROM olist_sellers s
      LEFT JOIN olist_order_items i ON s.seller_id = i.seller_id
      LEFT JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN olist_category_translations t ON p.product_category_name = t.product_category_name
      ${whereClause}
      GROUP BY s.seller_state
      ORDER BY count DESC
      LIMIT 10
    `;
    const geoResult = await db.query(geoQuery, params);

    // 4. Phân khúc điểm đánh giá
    const ratingQuery = `
      SELECT 
        ROUND(r.review_score) as stars,
        COUNT(DISTINCT s.seller_id) as count
      FROM olist_sellers s
      INNER JOIN olist_order_items i ON s.seller_id = i.seller_id
      INNER JOIN olist_orders o ON i.order_id = o.order_id
      INNER JOIN olist_order_reviews r ON o.order_id = r.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN olist_category_translations t ON p.product_category_name = t.product_category_name
      ${whereClause}
      AND r.review_score IS NOT NULL
      GROUP BY ROUND(r.review_score)
      ORDER BY stars DESC
    `;
    const ratingResult = await db.query(ratingQuery, params);

    // THÊM MỚI 5. Tìm ra 5 khu vực (Bang) có doanh thu từ hệ thống người bán thấp nhất (Yếu thế)
    const bottomRegionsQuery = `
      SELECT 
        s.seller_state as state,
        COUNT(DISTINCT s.seller_id) as sellers_count,
        COALESCE(SUM(i.price), 0) as total_revenue
      FROM olist_sellers s
      INNER JOIN olist_order_items i ON s.seller_id = i.seller_id
      INNER JOIN olist_orders o ON i.order_id = o.order_id
      ${whereClause}
      GROUP BY s.seller_state
      ORDER BY total_revenue ASC
      LIMIT 5
    `;
    const bottomRegionsResult = await db.query(bottomRegionsQuery, params);

    const sellersList = allSellersResult.rows.map(row => ({
      id: row.seller_id.substring(0, 8) + '...',
      fullId: row.seller_id,
      city: row.city,
      state: row.state,
      revenue: Math.round(Number(row.revenue)),
      rating: Math.round(Number(row.rating) * 100) / 100,
      deliverySuccessRate: Math.round(Number(row.delivery_success_rate) * 10) / 10 || 0
    }));

    return {
      kpis: {
        total_sellers: Number(kpiRow.total_sellers) || 0,
        avg_seller_rating: Math.round(Number(kpiRow.avg_seller_rating) * 100) / 100 || 0
      },
      topSellers: sellersList.slice(0, 5),
      allSellers: sellersList,
      geoData: geoResult.rows.map(r => ({ state: r.state, value: Number(r.count) })),
      ratingData: ratingResult.rows.map(r => ({ name: `${r.stars} Sao`, value: Number(r.count) })),
      // Trả thêm mảng dữ liệu vùng yếu thế về Frontend
      bottomRegions: bottomRegionsResult.rows.map(r => ({
        state: r.state,
        sellersCount: Number(r.sellers_count),
        revenue: Math.round(Number(r.total_revenue))
      }))
    };

  } catch (error: any) {
    console.error('[Seller Metrics Error] Failed to execute database queries:', error.message);
    throw error;
  }
}