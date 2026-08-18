import { query } from '../config/db.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const revenueRes = await query("SELECT COALESCE(SUM(total), 0) as total_revenue FROM orders WHERE payment_status = 'Paid'");
    const ordersRes = await query("SELECT COUNT(*) as total_orders FROM orders");
    const productsRes = await query("SELECT COUNT(*) as total_products FROM products");
    const usersRes = await query("SELECT COUNT(*) as total_users FROM users");

    const recentOrdersRes = await query(`
      SELECT o.id, o.order_number, o.total, o.status, o.payment_status, o.created_at,
             u.name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      metrics: {
        totalRevenue: parseFloat(revenueRes.rows[0].total_revenue),
        totalOrders: parseInt(ordersRes.rows[0].total_orders, 10),
        totalProducts: parseInt(productsRes.rows[0].total_products, 10),
        totalUsers: parseInt(usersRes.rows[0].total_users, 10),
        recentOrders: recentOrdersRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
};
