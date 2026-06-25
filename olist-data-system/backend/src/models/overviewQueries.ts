import { db } from '../config/database';

interface OverviewFilters {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  category?: string;
  state?: string;
  city?: string;
  sellerId?: string;
}

/**
 * Hàm bổ trợ xây dựng điều kiện WHERE động dựa trên bộ lọc từ frontend
 */
function buildFilterClause(filters?: OverviewFilters) {
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
  if (filters.sellerId) {
    conditions.push(`i.seller_id = $${paramIndex}`);
    params.push(filters.sellerId);
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
 * Lấy các chỉ số KPI tổng quan và dữ liệu biểu đồ doanh thu theo tháng từ PostgreSQL
 */
export async function fetchOverviewMetrics(filters?: OverviewFilters) {
  const { whereClause, params } = buildFilterClause(filters);

  try {
    // 1. Truy vấn các chỉ số KPIs tổng hợp bằng một câu lệnh duy nhất để tối ưu hiệu năng
    const kpiQuery = `
      SELECT 
        COALESCE(SUM(i.price), 0) as total_revenue,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT c.customer_unique_id) as total_customers,
        COUNT(DISTINCT i.product_id) as total_products,
        COUNT(DISTINCT i.seller_id) as total_sellers
      FROM olist_orders o
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      LEFT JOIN olist_order_items i ON o.order_id = i.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      ${whereClause}
    `;

    const kpiResult = await db.query(kpiQuery, params);
    const kpiRow = kpiResult.rows[0];

    const totalRevenue = Number(kpiRow.total_revenue);
    const totalOrders = Number(kpiRow.total_orders);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Truy vấn dữ liệu phân rã theo từng tháng cho biểu đồ doanh thu
    // Sử dụng TO_CHAR để định dạng tháng rút gọn (Jan, Feb, Mar...)
    const monthlyQuery = `
      SELECT 
        TO_CHAR(o.order_purchase_timestamp::timestamp, 'Mon YYYY') as month_name, 
        TO_CHAR(o.order_purchase_timestamp::timestamp, 'YYYY-MM') as sort_date,
        COALESCE(SUM(i.price), 0) as revenue,
        COUNT(DISTINCT o.order_id) as orders
      FROM olist_orders o
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      LEFT JOIN olist_order_items i ON o.order_id = i.order_id
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      ${whereClause}
      GROUP BY month_name, sort_date
      ORDER BY sort_date ASC
    `;

    const monthlyResult = await db.query(monthlyQuery, params);
    
    // Định dạng lại kết quả trả về khớp với cấu trúc mong đợi của Frontend
    const monthlyData = monthlyResult.rows.map(row => ({
      month: row.month_name,
      revenue: Math.round(Number(row.revenue)),
      orders: Number(row.orders)
    }));

    return {
      kpis: {
        total_revenue: Math.round(totalRevenue),
        total_orders: totalOrders,
        total_customers: Number(kpiRow.total_customers),
        total_products: Number(kpiRow.total_products),
        total_sellers: Number(kpiRow.total_sellers),
        average_order_value: Math.round(averageOrderValue * 100) / 100
      },
      monthlyData,
      growthRate: 16.4 // Giá trị tĩnh từ thiết kế cũ, có thể tính toán động nếu cần
    };

  } catch (error: any) {
    console.error('[Overview Metrics Error] Failed to execute database queries:', error.message);
    throw error;
  }
}