import { db } from '../config/database';

interface OrderFilters {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  state?: string;
  city?: string;
}

/**
 * Xây dựng điều kiện WHERE động cho các bảng Đơn hàng và Khách hàng
 */
function buildFilterClause(filters?: OrderFilters) {
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
 * Lấy các chỉ số KPI, thống kê trạng thái và phân tích tốc độ giao hàng
 */
export async function fetchOrdersMetrics(filters?: OrderFilters) {
  const { whereClause, params } = buildFilterClause(filters);

  try {
    const statusQuery = `
      SELECT 
        o.order_status as status,
        COUNT(o.order_id) as count
      FROM olist_orders o
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause}
      GROUP BY o.order_status
    `;
    const statusResult = await db.query(statusQuery, params);
    
    let totalOrders = 0;
    let delivered = 0;
    let pending = 0;
    let canceled = 0;

    const statusData = statusResult.rows.map(row => {
      const count = Number(row.count);
      const status = row.status || 'other';
      
      totalOrders += count;
      if (status === 'delivered') delivered += count;
      else if (status === 'canceled') canceled += count;
      else pending += count;

      return {
        name: status.toUpperCase(),
        value: count
      };
    }).sort((a, b) => b.value - a.value);

    const deliveryQuery = `
      SELECT 
        TO_CHAR(o.order_purchase_timestamp::timestamp, 'Mon') as month_name,
        EXTRACT(MONTH FROM o.order_purchase_timestamp::timestamp) as month_num,
        AVG(EXTRACT(EPOCH FROM (o.order_delivered_customer_date::timestamp - o.order_purchase_timestamp::timestamp)) / 86400) as speed,
        AVG(EXTRACT(EPOCH FROM (o.order_estimated_delivery_date::timestamp - o.order_purchase_timestamp::timestamp)) / 86400) as estimated
      FROM olist_orders o
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
        o.order_delivered_customer_date IS NOT NULL 
        AND o.order_estimated_delivery_date IS NOT NULL
      GROUP BY month_name, month_num
      ORDER BY month_num ASC
    `;
    const deliveryResult = await db.query(deliveryQuery, params);
    
    const deliverySpeed = deliveryResult.rows.map(row => ({
      month: row.month_name,
      speed: Math.round(Number(row.speed) * 10) / 10,
      estimated: Math.round(Number(row.estimated) * 10) / 10
    }));

    return {
      kpis: {
        total_orders: totalOrders,
        delivered,
        pending,
        canceled
      },
      statusData,
      deliverySpeed
    };

  } catch (error: any) {
    console.error('[Order Metrics Error] Failed to execute database queries:', error.message);
    throw error;
  }
}

/**
 * Global Order Search & Listing
 * Truy xuất danh sách đơn hàng cho bảng dữ liệu (Data Table)
 */
export async function searchOlistOrders(queryText?: string) {
  const qClean = queryText ? queryText.trim().toLowerCase() : "";
  
  let query = `
    SELECT 
      o.order_id, 
      o.customer_id, 
      o.order_status, 
      o.order_purchase_timestamp as purchase_date, 
      c.customer_city as city, 
      c.customer_state as state,
      COUNT(i.order_item_id) as items_count,
      COALESCE(SUM(i.price), p.payment_value, 0) as total_price,
      COALESCE(p.payment_type, 'N/A') as payment_type
    FROM olist_orders o
    LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
    LEFT JOIN olist_order_items i ON o.order_id = i.order_id
    LEFT JOIN (
      SELECT order_id, MIN(payment_type) as payment_type, SUM(payment_value) as payment_value 
      FROM olist_order_payments 
      GROUP BY order_id
    ) p ON o.order_id = p.order_id
  `;

  const params: any[] = [];

  if (qClean !== "") {
    query += ` 
      WHERE LOWER(o.order_id) LIKE $1 
         OR LOWER(c.customer_city) LIKE $1 
         OR LOWER(c.customer_state) LIKE $1 
         OR LOWER(p.payment_type) LIKE $1
    `;
    params.push(`%${qClean}%`);
  }

  query += ` 
    GROUP BY o.order_id, c.customer_city, c.customer_state, p.payment_value, p.payment_type 
    ORDER BY o.order_purchase_timestamp DESC
    LIMIT 100 
  `;

  try {
    const result = await db.query(query, params);
    
    return result.rows.map(row => ({
      ...row,
      items_count: Number(row.items_count),
      total_price: Math.round(Number(row.total_price) * 100) / 100
    }));
  } catch (error: any) {
    console.error('[Order Search Error] Failed to execute database query:', error.message);
    throw error;
  }
}

/**
 * Get Single Order Details Data (Order, Customer, Items, Payments, Reviews)
 */
export async function getOrderDetailsData(orderId: string) {
  try {
    const orderQuery = `
      SELECT o.*, c.*
      FROM olist_orders o
      LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
      WHERE o.order_id = $1
    `;
    
    const itemsQuery = `
      SELECT 
        i.*, 
        p.product_category_name, 
        COALESCE(t.product_category_name_english, p.product_category_name, 'others') as category_english,
        s.seller_city, 
        s.seller_state
      FROM olist_order_items i
      LEFT JOIN olist_products p ON i.product_id = p.product_id
      LEFT JOIN clean_translations t ON p.product_category_name = t.product_category_name
      LEFT JOIN olist_sellers s ON i.seller_id = s.seller_id
      WHERE i.order_id = $1
    `;

    const paymentsQuery = `SELECT * FROM olist_order_payments WHERE order_id = $1`;
    const reviewsQuery = `SELECT * FROM olist_order_reviews WHERE order_id = $1`;

    const [orderRes, itemsRes, paymentsRes, reviewsRes] = await Promise.all([
      db.query(orderQuery, [orderId]),
      db.query(itemsQuery, [orderId]),
      db.query(paymentsQuery, [orderId]),
      db.query(reviewsQuery, [orderId])
    ]);

    if (orderRes.rows.length === 0) {
      return null;
    }

    const orderData = orderRes.rows[0];

    const items = itemsRes.rows.map(item => ({
      ...item,
      product_name: `Sản phẩm ${item.product_id.substring(0, 6).toUpperCase()} (${item.category_english})`,
      seller_name: item.seller_city || 'Nhà bán hàng Olist'
    }));

    return {
      order: {
        order_id: orderData.order_id,
        customer_id: orderData.customer_id,
        order_status: orderData.order_status,
        order_purchase_timestamp: orderData.order_purchase_timestamp,
        order_approved_at: orderData.order_approved_at,
        order_delivered_carrier_date: orderData.order_delivered_carrier_date,
        order_delivered_customer_date: orderData.order_delivered_customer_date,
        order_estimated_delivery_date: orderData.order_estimated_delivery_date
      },
      client: {
        customer_id: orderData.customer_id,
        customer_unique_id: orderData.customer_unique_id,
        customer_zip_code_prefix: orderData.customer_zip_code_prefix,
        customer_city: orderData.customer_city,
        customer_state: orderData.customer_state
      },
      items,
      payment: paymentsRes.rows,
      reviews: reviewsRes.rows
    };

  } catch (error: any) {
    console.error('[Order Details Error] Failed to fetch from DB:', error.message);
    throw error;
  }
}