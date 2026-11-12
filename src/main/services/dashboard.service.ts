import { getDb } from '../database/connection'

export const dashboardService = {
  stats() {
    const db = getDb()
    const today = new Date().toLocaleDateString('en-CA')
    
    const thresholdRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('low_stock_threshold') as any
    const threshold = thresholdRow ? Number(thresholdRow.value) : 10

    // Get Gross Sales
    const salesToday = db.prepare(`
      SELECT COALESCE(SUM(total), 0) AS amount, COUNT(*) AS count 
      FROM sales WHERE date(created_at, 'localtime') = ?
    `).get(today) as any

    // Get Total Refunds
    const refundsToday = db.prepare(`
      SELECT COALESCE(SUM(total_refund), 0) AS amount 
      FROM returns WHERE date(created_at, 'localtime') = ?
    `).get(today) as any

    const netRevenue = salesToday.amount - refundsToday.amount

    const totalMedicines = (db.prepare('SELECT COUNT(*) AS c FROM medicines WHERE is_active = 1').get() as any).c
    const lowStock = (db.prepare(`SELECT COUNT(*) AS c FROM (SELECT m.id FROM medicines m LEFT JOIN batches b ON b.medicine_id = m.id WHERE m.is_active = 1 GROUP BY m.id HAVING COALESCE(SUM(b.qty), 0) <= ?)`).get(threshold) as any).c
    const expiringSoon = (db.prepare(`SELECT COUNT(*) AS c FROM batches WHERE qty > 0 AND date(expiry_date) <= date('now', '+90 days', 'localtime')`).get() as any).c
    const totalCustomers = (db.prepare('SELECT COUNT(*) AS c FROM customers').get() as any).c
    
    const topSelling = db.prepare(`
      SELECT m.name, SUM(si.qty) as total_qty 
      FROM sale_items si JOIN medicines m ON m.id = si.medicine_id JOIN sales s ON s.id = si.sale_id 
      WHERE date(s.created_at, 'localtime') >= date('now', '-30 days', 'localtime') GROUP BY m.id ORDER BY total_qty DESC LIMIT 5
    `).all()

    const salesTrend = db.prepare(`
      SELECT 
        date(created_at, 'localtime') as date, 
        COALESCE(SUM(total), 0) as sales 
      FROM sales 
      WHERE date(created_at, 'localtime') >= date('now', '-7 days', 'localtime')
      GROUP BY date 
      ORDER BY date ASC
    `).all()

    return { 
      salesToday: { amount: netRevenue, count: salesToday.count }, 
      refundsToday: refundsToday.amount,
      totalMedicines, lowStock, expiringSoon, totalCustomers, topSelling, salesTrend 
    }
  },

  getAlerts() {
    const db = getDb()
    const thresholdRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('low_stock_threshold') as any
    const threshold = thresholdRow ? Number(thresholdRow.value) : 10
    
    const lowStockItems = db.prepare(`
      SELECT m.name, COALESCE(SUM(b.qty), 0) AS qty 
      FROM medicines m LEFT JOIN batches b ON b.medicine_id = m.id 
      WHERE m.is_active = 1
      GROUP BY m.id HAVING COALESCE(SUM(b.qty), 0) <= ? ORDER BY COALESCE(SUM(b.qty), 0) ASC LIMIT 10
    `).all(threshold)

    const expiringItems = db.prepare(`
      SELECT b.batch_no, b.expiry_date, b.qty, m.name as medicine_name 
      FROM batches b JOIN medicines m ON m.id = b.medicine_id 
      WHERE b.qty > 0 AND date(b.expiry_date) <= date('now', '+90 days', 'localtime') AND m.is_active = 1
      ORDER BY b.expiry_date ASC LIMIT 10
    `).all()

    return { lowStockItems, expiringItems }
  }
}