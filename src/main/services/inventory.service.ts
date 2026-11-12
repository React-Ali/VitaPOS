import { getDb } from '../database/connection'

export const inventoryService = {
  addStock(input: any, userId: number) {
    const db = getDb()
    const qty = Number(input.qty) || 0
    const costPrice = Number(input.costPrice) || Number(input.cost_price) || 0
    const totalAmount = qty * costPrice
    const paidAmount = input.paidAmount !== undefined ? Number(input.paidAmount) : totalAmount
    const paymentStatus = paidAmount >= totalAmount ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Credit')

    if (qty <= 0) throw new Error('Quantity must be greater than 0')

    const tx = db.transaction(() => {
      db.prepare(`INSERT INTO purchases (supplier_id, invoice_no, total_amount, paid_amount, payment_status) VALUES (?, ?, ?, ?, ?)`).run(input.supplierId || null, input.invoiceNo || 'Manual Entry', totalAmount, paidAmount, paymentStatus)
      const existing = db.prepare('SELECT id FROM batches WHERE medicine_id = ? AND batch_no = ?').get(input.medicineId, input.batchNo) as any
      if (existing) {
        db.prepare('UPDATE batches SET qty = qty + ?, expiry_date = ? WHERE id = ?').run(qty, input.expiryDate, existing.id)
      } else {
        db.prepare(`INSERT INTO batches (medicine_id, batch_no, expiry_date, qty, cost_price, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`).run(input.medicineId, input.batchNo, input.expiryDate, qty, costPrice, input.supplierId || null)
      }
    })
    tx()
  },

  getPurchaseHistory() {
    return getDb().prepare(`SELECT p.*, s.name as supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.id DESC`).all()
  },

  updateBatch(batchId: number, input: any) {
    getDb().prepare(`UPDATE batches SET batch_no=?, expiry_date=?, qty=?, cost_price=? WHERE id=?`).run(input.batch_no, input.expiry_date, Number(input.qty) || 0, Number(input.cost_price) || 0, batchId)
  },

  deleteBatch(batchId: number) {
    getDb().prepare('DELETE FROM batches WHERE id = ?').run(batchId)
  },

  adjustStock(batchId: number, qty: number, type: string, notes: string, userId: number) {
    const db = getDb()
    const batch = db.prepare('SELECT qty FROM batches WHERE id = ?').get(batchId) as { qty: number }
    if (!batch || batch.qty < qty) throw new Error('Not enough stock to remove.')
    db.prepare('UPDATE batches SET qty = qty - ? WHERE id = ?').run(qty, batchId)
    db.prepare(`INSERT INTO stock_adjustments (batch_id, qty, type, notes, user_id) VALUES (?, ?, ?, ?, ?)`).run(batchId, qty, type, notes, userId)
  },

  getLowStock() {
    const db = getDb()
    const thresholdRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('low_stock_threshold') as any
    const threshold = thresholdRow ? Number(thresholdRow.value) : 10
    return db.prepare(`SELECT m.id, m.name, m.mrp, COALESCE(SUM(b.qty), 0) AS qty FROM medicines m LEFT JOIN batches b ON b.medicine_id = m.id WHERE m.is_active = 1 GROUP BY m.id HAVING COALESCE(SUM(b.qty), 0) <= ? ORDER BY COALESCE(SUM(b.qty), 0) ASC`).all(threshold)
  },

  getExpiring() {
    return getDb().prepare(`SELECT b.id, b.batch_no, b.expiry_date, b.qty, m.name as medicine_name FROM batches b JOIN medicines m ON m.id = b.medicine_id WHERE b.qty > 0 AND date(b.expiry_date) <= date('now', '+90 days') AND m.is_active = 1 ORDER BY b.expiry_date ASC`).all()
  },

  getReturnHistory() {
    return getDb().prepare(`
      SELECT sa.*, b.batch_no, m.name as medicine_name, u.full_name as user_name
      FROM stock_adjustments sa
      JOIN batches b ON b.id = sa.batch_id
      JOIN medicines m ON m.id = b.medicine_id
      JOIN users u ON u.id = sa.user_id
      WHERE sa.type = 'supplier_return' OR sa.type = 'expired' OR sa.type = 'damaged'
      ORDER BY sa.id DESC
    `).all()
  }
}