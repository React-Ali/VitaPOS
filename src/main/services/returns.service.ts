import { getDb } from '../database/connection'

export const returnsService = {
  getSaleForReturn(invoiceNo: string) {
    const db = getDb()
    const sale = db.prepare('SELECT * FROM sales WHERE invoice_no = ?').get(invoiceNo) as any
    if (!sale) throw new Error('Invoice not found')

    const items = db.prepare(`
      SELECT si.*, m.name as medicine_name, b.batch_no,
      (si.qty - COALESCE((SELECT SUM(ri.qty) FROM return_items ri WHERE ri.sale_item_id = si.id), 0)) as returnable_qty
      FROM sale_items si
      JOIN medicines m ON m.id = si.medicine_id
      JOIN batches b ON b.id = si.batch_id
      WHERE si.sale_id = ?
    `).all(sale.id)

    return { sale, items }
  },

  processReturn(saleId: number, items: any[], userId: number, reason: string) {
    const db = getDb()
    const tx = db.transaction(() => {
      const totalRefund = items.reduce((sum, item) => sum + (item.refund_amount), 0)
      
      const res = db.prepare(
        'INSERT INTO returns (sale_id, user_id, total_refund, reason) VALUES (?, ?, ?, ?)'
      ).run(saleId, userId, totalRefund, reason)
      
      const returnId = Number(res.lastInsertRowid)

      for (const item of items) {
        if (item.qty <= 0) continue
        
        db.prepare(`
          INSERT INTO return_items (return_id, sale_item_id, medicine_id, batch_id, qty, refund_amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(returnId, item.sale_item_id, item.medicine_id, item.batch_id, item.qty, item.refund_amount)

        db.prepare('UPDATE batches SET qty = qty + ? WHERE id = ?').run(item.qty, item.batch_id)
      }

      db.prepare(`INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, 'SALE_RETURN', 'return', ?, ?)`)
        .run(userId, returnId, JSON.stringify({ totalRefund, reason }))

      return { returnId, totalRefund }
    })
    return tx()
  },

  // THIS WAS MISSING
  getHistory() {
    return getDb().prepare(`
      SELECT r.*, s.invoice_no, u.full_name as processed_by 
      FROM returns r 
      JOIN sales s ON s.id = r.sale_id 
      JOIN users u ON u.id = r.user_id 
      ORDER BY r.id DESC LIMIT 50
    `).all()
  }
}