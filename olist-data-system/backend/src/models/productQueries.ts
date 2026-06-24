import { db } from '../config/database';

interface ProductFilters {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  category?: string;
  state?: string;
  city?: string;
}

/**
 * Xây dựng điều kiện WHERE động cho các bảng liên quan đến Sản phẩm và Đơn hàng
 */
function buildFilterClause(filters?: ProductFilters) {
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
  if (filters.category) {
    conditions.push(`(LOWER(p.product_category_name) = LOWER($${paramIndex}) OR LOWER(t.product_category_name_english) = LOWER($${paramIndex}))`);
    params.push(filters.category.trim());
    paramIndex++;
  }

  // Đảm bảo chỉ tính các order_items có liên kết với order (tránh data rác nếu có)
  conditions.push(`o.order_id IS NOT NULL`);

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { whereClause, params };
}

/**
 * Lấy các chỉ số và phân tích hiệu suất Sản phẩm từ PostgreSQL
 */
export async function fetchProductsMetrics(filters?: ProductFilters) {
  const { whereClause, params } = buildFilterClause(filters);

  try {
    const kpiQuery = `
      SELECT 
        COUNT(DISTINCT p.product_id) as total_products,
        COUNT(DISTINCT COALESCE(t.product_category_name_english, p.product_category_name, 'others')) as total_categories
      FROM olist_products p
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_order_items i ON p.product_id = i.product_id
      LEFT JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause}
    `;
    const kpiResult = await db.query(kpiQuery, params);
    const kpis = kpiResult.rows[0];

    const categoryQuery = `
      SELECT 
        UPPER(REPLACE(COALESCE(t.product_category_name_english, p.product_category_name, 'others'), '_', ' ')) as name,
        COUNT(i.order_item_id) as value,
        COALESCE(SUM(i.price), 0) as revenue
      FROM olist_order_items i
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause}
      GROUP BY name
      ORDER BY value DESC
      LIMIT 15
    `;
    const categoryResult = await db.query(categoryQuery, params);
    const categoryDistribution = categoryResult.rows.map(row => ({
      name: row.name,
      value: Number(row.value),
      revenue: Math.round(Number(row.revenue))
    }));

    const topProductsQuery = `
      SELECT 
        p.product_id,
        COALESCE(t.product_category_name_english, p.product_category_name, 'others') as category,
        COUNT(i.order_item_id) as orders,
        COALESCE(SUM(i.price), 0) as revenue
      FROM olist_order_items i
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_orders o ON i.order_id = o.order_id
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause}
      GROUP BY p.product_id, category
      ORDER BY revenue DESC
      LIMIT 5
    `;
    const topProductsResult = await db.query(topProductsQuery, params);
    const topProducts = topProductsResult.rows.map(row => {
      const cleanCat = row.category.replace(/_/g, ' ').toUpperCase();
      const shortId = row.product_id.substring(0, 8).toUpperCase();
      return {
        name: `${shortId} (${cleanCat})`,
        orders: Number(row.orders),
        revenue: Math.round(Number(row.revenue)),
        category: row.category
      };
    });

    return {
      kpis: {
        total_products: Number(kpis.total_products) || 0,
        total_categories: Number(kpis.total_categories) || 0
      },
      categoryDistribution,
      topProducts
    };

  } catch (error: any) {
    console.error('[Product Metrics Error] Failed to execute database queries:', error.message);
    throw error;
  }
}

/**
 * Lấy danh sách các danh mục sản phẩm duy nhất cho bộ lọc
 */
export async function getCategoriesList() {
  try {
    const query = `
      SELECT 
        product_category_name_english as english,
        product_category_name as portuguese
      FROM clean_translations
      WHERE product_category_name_english IS NOT NULL
      ORDER BY product_category_name_english ASC
    `;
    const result = await db.query(query);
    
    return result.rows.map(row => ({
      vietnamese: row.english.replace(/_/g, ' ').toUpperCase(),
      english: row.english,
      portuguese: row.portuguese
    }));
  } catch (error: any) {
    console.error('[Categories List Error] Failed to fetch:', error.message);
    throw error;
  }
}