import { db } from '../config/database';

interface ReviewFilters {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  state?: string;
  city?: string;
}

/**
 * Hàm xây dựng bộ lọc động (Dynamic WHERE Clause)
 */
function buildFilterClause(filters?: ReviewFilters) {
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
    conditions.push(`c.customer_state = $${paramIndex}`);
    params.push(filters.state.toUpperCase());
    paramIndex++;
  }
  if (filters.city) {
    conditions.push(`LOWER(c.customer_city) = LOWER($${paramIndex})`);
    params.push(filters.city.trim());
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { whereClause, params };
}

export async function fetchReviewsMetrics(filters?: ReviewFilters) {
  const { whereClause, params } = buildFilterClause(filters);

  try {
    // 1. KPI TỔNG QUAN & PHÂN BỐ ĐIỂM SỐ
    const kpiQuery = `
      SELECT 
        COUNT(r.review_id) as total_reviews,
        AVG(r.review_score) as avg_rating
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause}
    `;
    const kpiResult = await db.query(kpiQuery, params);
    const totalReviews = Number(kpiResult.rows[0].total_reviews) || 0;
    const avgRating = Number(kpiResult.rows[0].avg_rating) || 0;

    const distributionQuery = `
      SELECT r.review_score as rating_score, COUNT(r.review_id) as count
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause}
      GROUP BY r.review_score
      ORDER BY r.review_score DESC
    `;
    const distributionResult = await db.query(distributionQuery, params);
    const distributionMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distributionResult.rows.forEach(row => {
      if (distributionMap[Number(row.rating_score)] !== undefined) {
        distributionMap[Number(row.rating_score)] = Number(row.count);
      }
    });
    const distribution = Object.entries(distributionMap)
      .map(([score, count]) => ({
        rating: `${score} ★`,
        count,
        percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
      })).sort((a, b) => b.rating.localeCompare(a.rating));


    // 2. TỐC ĐỘ KHÁCH HÀNG GỬI ĐÁNH GIÁ (SURVEY RESPONSE)
    const responseSpeedQuery = `
      SELECT 
        CASE 
          WHEN EXTRACT(EPOCH FROM (r.review_answer_timestamp::timestamp - r.review_creation_date::timestamp)) / 86400 < 1 THEN '< 1 ngày'
          WHEN EXTRACT(EPOCH FROM (r.review_answer_timestamp::timestamp - r.review_creation_date::timestamp)) / 86400 <= 2 THEN '1-2 ngày'
          WHEN EXTRACT(EPOCH FROM (r.review_answer_timestamp::timestamp - r.review_creation_date::timestamp)) / 86400 <= 5 THEN '3-5 ngày'
        ELSE '> 5 ngày' END as speed_bucket,
        COUNT(r.review_id) as count
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
        r.review_answer_timestamp IS NOT NULL AND r.review_creation_date IS NOT NULL
      GROUP BY speed_bucket
    `;
    const responseSpeedResult = await db.query(responseSpeedQuery, params);
    const totalAnswered = responseSpeedResult.rows.reduce((sum, row) => sum + Number(row.count), 0);
    const speedMap: Record<string, number> = { '< 1 ngày': 0, '1-2 ngày': 0, '3-5 ngày': 0, '> 5 ngày': 0 };
    responseSpeedResult.rows.forEach(row => {
      if (speedMap[row.speed_bucket] !== undefined) speedMap[row.speed_bucket] = Number(row.count);
    });
    const responseTimes = Object.entries(speedMap).map(([speed, count]) => ({
      speed, percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0
    }));


    // 3. ACTIONABLE INSIGHT: TƯƠNG QUAN GIAO HÀNG & CHẤT LƯỢNG
    const correlationQuery = `
      SELECT 
        ROUND(EXTRACT(EPOCH FROM (o.order_delivered_customer_date::timestamp - o.order_purchase_timestamp::timestamp)) / 86400) as delivery_days,
        AVG(r.review_score) as avg_score,
        COUNT(r.review_id) as review_count
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
        o.order_delivered_customer_date IS NOT NULL AND r.review_score IS NOT NULL
        AND EXTRACT(EPOCH FROM (o.order_delivered_customer_date::timestamp - o.order_purchase_timestamp::timestamp)) / 86400 BETWEEN 1 AND 30
      GROUP BY ROUND(EXTRACT(EPOCH FROM (o.order_delivered_customer_date::timestamp - o.order_purchase_timestamp::timestamp)) / 86400)
      HAVING COUNT(r.review_id) > 10
      ORDER BY delivery_days ASC
    `;
    const correlationResult = await db.query(correlationQuery, params);


    // 4. ACTIONABLE INSIGHT: TỬ HUYỆT NGÀNH HÀNG & SELLER GÂY RA RỦI RO LỚN NHẤT
    const badCategoriesQuery = `
      SELECT 
        COALESCE(t.product_category_name_english, p.product_category_name, 'Khác') as category,
        COUNT(r.review_id) as total_cat_reviews,
        (SUM(CASE WHEN r.review_score <= 2 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(r.review_id), 0)) as bad_rate
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      INNER JOIN olist_order_items i ON o.order_id = i.order_id
      INNER JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN olist_category_translations t ON p.product_category_name = t.product_category_name
      ${whereClause}
      GROUP BY category
      HAVING COUNT(r.review_id) > 50
      ORDER BY bad_rate DESC
      LIMIT 5
    `;
    const badCategoriesResult = await db.query(badCategoriesQuery, params);

    const badSellersQuery = `
      SELECT 
        i.seller_id,
        COUNT(DISTINCT r.review_id) as total_seller_reviews,
        (SUM(CASE WHEN r.review_score <= 2 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT r.review_id), 0)) as bad_rate
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      INNER JOIN olist_order_items i ON o.order_id = i.order_id
      ${whereClause}
      GROUP BY i.seller_id
      HAVING COUNT(DISTINCT r.review_id) > 20
      ORDER BY bad_rate DESC
      LIMIT 5
    `;
    const badSellersResult = await db.query(badSellersQuery, params);


    // 5. ACTIONABLE INSIGHT: TRẠM XỬ LÝ KHỦNG HOẢNG (CRITICAL TICKETS)
    const criticalReviewsQuery = `
      SELECT 
        r.review_id,
        r.order_id,
        r.review_score,
        r.review_comment_message as message,
        TO_CHAR(r.review_creation_date::timestamp, 'DD/MM/YYYY') as review_date
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
        r.review_score <= 2 
        AND r.review_comment_message IS NOT NULL 
        AND LENGTH(TRIM(r.review_comment_message)) > 5
      ORDER BY r.review_creation_date DESC
      LIMIT 100
    `;
    const criticalReviewsResult = await db.query(criticalReviewsQuery, params);


    // TRẢ DỮ LIỆU VỀ FRONTEND
    return {
      kpis: {
        avg_rating: Math.round(avgRating * 100) / 100,
        total_reviews: totalReviews
      },
      distribution,
      responseTimes,
      correlationData: correlationResult.rows.map(r => ({
        days: Number(r.delivery_days),
        rating: Math.round(Number(r.avg_score) * 100) / 100
      })),
      badCategories: badCategoriesResult.rows.map(r => ({
        category: r.category,
        total: Number(r.total_cat_reviews),
        badRate: Math.round(Number(r.bad_rate) * 10) / 10
      })),
      badSellers: badSellersResult.rows.map(r => ({
        id: r.seller_id.substring(0, 8) + '...',
        fullId: r.seller_id,
        total: Number(r.total_seller_reviews),
        badRate: Math.round(Number(r.bad_rate) * 10) / 10
      })),
      criticalReviews: criticalReviewsResult.rows
    };

  } catch (error: any) {
    console.error('[Review Metrics Error]', error.message);
    throw error;
  }
}