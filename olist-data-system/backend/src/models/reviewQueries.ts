import { db } from '../config/database';

interface ReviewFilters {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  state?: string;
  city?: string;
}

/**
 * Xây dựng điều kiện WHERE động cho các bộ lọc liên quan đến Đánh giá và Đơn hàng
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

/**
 * Lấy các KPI về đánh giá, phân bố số sao và tốc độ phản hồi từ PostgreSQL
 */
export async function fetchReviewsMetrics(filters?: ReviewFilters) {
  const { whereClause, params } = buildFilterClause(filters);

  try {
    // 1. Lấy tổng số đánh giá và điểm số trung bình (KPIs)
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
    const kpiRow = kpiResult.rows[0];
    const totalReviews = Number(kpiRow.total_reviews) || 0;
    const avgRating = Number(kpiRow.avg_rating) || 0;

    // 2. Truy vấn phân bố số lượng theo từng mức sao (1 Sao -> 5 Sao)
    const distributionQuery = `
      SELECT 
        r.review_score as rating_score,
        COUNT(r.review_id) as count
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause}
      GROUP BY r.review_score
      ORDER BY r.review_score DESC
    `;
    const distributionResult = await db.query(distributionQuery, params);

    // Chuẩn bị khung dữ liệu mặc định để đảm bảo đủ từ 1 đến 5 sao
    const distributionMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distributionResult.rows.forEach(row => {
      const score = Number(row.rating_score);
      if (distributionMap[score] !== undefined) {
        distributionMap[score] = Number(row.count);
      }
    });

    const distribution = Object.entries(distributionMap)
      .map(([score, count]) => ({
        rating: `${score} Sao`,
        count,
        percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
      }))
      .sort((a, b) => b.rating.localeCompare(a.rating)); // Sắp xếp 5 sao xuống 1 sao

    // 3. Tính toán Tốc độ phản hồi đánh giá thực tế (Response Times) bằng khoảng cách ngày
    const responseSpeedQuery = `
      SELECT 
        CASE 
          WHEN EXTRACT(EPOCH FROM (r.review_answer_timestamp::timestamp - r.review_creation_date::timestamp)) / 86400 < 1 THEN '< 1 ngày'
          WHEN EXTRACT(EPOCH FROM (r.review_answer_timestamp::timestamp - r.review_creation_date::timestamp)) / 86400 <= 2 THEN '1-2 ngày'
          WHEN EXTRACT(EPOCH FROM (r.review_answer_timestamp::timestamp - r.review_creation_date::timestamp)) / 86400 <= 5 THEN '3-5 ngày'
        ELSE '> 5 ngày'
        END as speed_bucket,
        COUNT(r.review_id) as count
      FROM olist_order_reviews r
      INNER JOIN olist_orders o ON r.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
        r.review_answer_timestamp IS NOT NULL 
        AND r.review_creation_date IS NOT NULL
      GROUP BY speed_bucket
    `;
    const responseSpeedResult = await db.query(responseSpeedQuery, params);

    // Tính tổng số lượng đánh giá có phản hồi để quy đổi phần trăm chính xác
    const totalAnswered = responseSpeedResult.rows.reduce((sum, row) => sum + Number(row.count), 0);
    
    const speedMap: Record<string, number> = { '< 1 ngày': 0, '1-2 ngày': 0, '3-5 ngày': 0, '> 5 ngày': 0 };
    responseSpeedResult.rows.forEach(row => {
      if (speedMap[row.speed_bucket] !== undefined) {
        speedMap[row.speed_bucket] = Number(row.count);
      }
    });

    const responseTimes = Object.entries(speedMap).map(([speed, count]) => ({
      speed,
      percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0
    }));

    return {
      kpis: {
        avg_rating: Math.round(avgRating * 100) / 100,
        total_reviews: totalReviews
      },
      distribution,
      responseTimes
    };

  } catch (error: any) {
    console.error('[Review Metrics Error] Failed to execute database queries:', error.message);
    throw error;
  }
}