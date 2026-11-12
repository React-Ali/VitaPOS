import { getDb } from '../database/connection'

export const reportService = {
  getSalesReport(startDate: string, endDate: string) {
    const db = getDb()
    const sales = db.prepare(`
      SELECT s.*, u.full_name as cashier 
      FROM sales s JOIN users u ON u.id = s.user_id 
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
      ORDER BY s.id DESC
    `).all(startDate, endDate)
    
    const summary = db.prepare(`
      SELECT COUNT(id) as total_tx, COALESCE(SUM(total), 0) as total_amount 
      FROM sales WHERE date(created_at) >= ? AND date(created_at) <= ?
    `).get(startDate, endDate)
    return { sales, summary }
  },

  getProfitReport(startDate: string, endDate: string) {
    const db = getDb()
    const profitData = db.prepare(`
      SELECT 
        m.name,
        SUM(si.qty) as qty_sold,
        SUM(si.line_total) as total_revenue,
        SUM(CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty) as total_cost,
        SUM(si.line_total - (CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty)) as total_profit
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN batches b ON b.id = si.batch_id
      JOIN medicines m ON m.id = si.medicine_id
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
      GROUP BY m.id
      ORDER BY total_profit DESC
    `).all(startDate, endDate)

    const overallSummary = db.prepare(`
      SELECT 
        SUM(si.line_total) as total_revenue,
        SUM(CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty) as total_cost,
        SUM(si.line_total - (CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty)) as total_profit
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN batches b ON b.id = si.batch_id
      JOIN medicines m ON m.id = si.medicine_id
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
    `).get(startDate, endDate)

    return { profitData, overallSummary }
  },

  getProfitAndLoss(startDate: string, endDate: string) {
    const db = getDb()
    
    const revRow = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as revenue 
      FROM sales WHERE date(created_at) >= ? AND date(created_at) <= ?
    `).get(startDate, endDate) as any

    // SMART LOGIC: Uses batch cost, falls back to product purchase price
    const cogsRow = db.prepare(`
      SELECT COALESCE(SUM(
        (CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END) * si.qty
      ), 0) as cogs
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN batches b ON b.id = si.batch_id
      JOIN medicines m ON m.id = si.medicine_id
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
    `).get(startDate, endDate) as any

    const expRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as expenses 
      FROM expenses WHERE date BETWEEN ? AND ?
    `).get(startDate, endDate) as any

    const revenue = revRow.revenue || 0
    const cogs = cogsRow.cogs || 0
    const expenses = expRow.expenses || 0
    const netProfit = revenue - cogs - expenses

    return { revenue, cogs, expenses, netProfit }
  }
}