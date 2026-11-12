import { getDb } from '../database/connection'
import { mrpService } from './mrp.service'

export const salesService = {
  create(input: any, userId: number) {
    const db = getDb()
    if (!input.items.length) throw new Error('Cart is empty')

    const hasControlled = input.items.some((i: any) => i.schedule === 'G' || i.schedule === 'D')
    if (hasControlled && (!input.customerCnic?.trim() || !input.doctorId)) {
      throw new Error('CNIC and Doctor required for controlled drugs')
    }

    const tx = db.transaction(() => {
      const today = new Date().toLocaleDateString('en-CA').replace(/-/g, '')
      const prefix = `NMS-${today}-`
      const last = db.prepare(`SELECT invoice_no FROM sales WHERE invoice_no LIKE ? ORDER BY id DESC LIMIT 1`).get(`${prefix}%`) as any
      const seq = last ? Number(last.invoice_no.split('-').pop()) + 1 : 1
      const invoiceNo = `${prefix}${String(seq).padStart(4, '0')}`

      let subtotal = 0
      for (const item of input.items) {
        mrpService.assertWithinMrp(item.medicineId, item.unitPrice)
        const batch = db.prepare('SELECT qty, batch_no, expiry_date FROM batches WHERE id = ?').get(item.batchId) as any
        if (!batch) throw new Error(`Batch not found`)
        if (batch.expiry_date < new Date().toISOString().slice(0, 10)) throw new Error(`Batch ${batch.batch_no} is expired`)
        if (batch.qty < item.qty) throw new Error(`Insufficient stock in batch ${batch.batch_no}`)
        subtotal += item.unitPrice * item.qty
      }

      const total = subtotal - (input.discount || 0)
      const paidAmount = input.paymentMethod === 'Credit' ? 0 : total
      
      const saleRes = db.prepare(
        `INSERT INTO sales (invoice_no, user_id, customer_id, subtotal, discount, total, payment_method, payment_status, paid_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(invoiceNo, userId, input.customerId || null, subtotal, input.discount || 0, total, input.paymentMethod || 'Cash', input.paymentMethod === 'Credit' ? 'Credit' : 'Paid', paidAmount)
      
      const saleId = Number(saleRes.lastInsertRowid)
      const insertItem = db.prepare(`INSERT INTO sale_items (sale_id, medicine_id, batch_id, qty, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)`)
      const updateBatch = db.prepare('UPDATE batches SET qty = qty - ? WHERE id = ?')

      for (const item of input.items) {
        insertItem.run(saleId, item.medicineId, item.batchId, item.qty, item.unitPrice, item.unitPrice * item.qty)
        updateBatch.run(item.qty, item.batchId)
        if (item.schedule === 'G' || item.schedule === 'D') {
          const bNo = db.prepare('SELECT batch_no FROM batches WHERE id = ?').get(item.batchId) as any
          db.prepare(`INSERT INTO controlled_register (sale_id, medicine_id, batch_no, qty, customer_cnic, doctor_id, doctor_name) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(saleId, item.medicineId, bNo.batch_no, item.qty, input.customerCnic, input.doctorId, input.doctorName)
        }
      }
      return { id: saleId, invoiceNo, total }
    })
    return tx()
  },

  getHistory() {
    return getDb().prepare(`
      SELECT s.*, c.name as customer_name, u.full_name as cashier 
      FROM sales s 
      LEFT JOIN customers c ON c.id = s.customer_id 
      JOIN users u ON u.id = s.user_id
      ORDER BY s.id DESC LIMIT 100
    `).all()
  },

  getSaleDetails(saleId: number) {
    const db = getDb()
    const sale = db.prepare(`SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE s.id = ?`).get(saleId) as any
    const items = db.prepare(`
      SELECT si.*, m.name as medicine_name 
      FROM sale_items si JOIN medicines m ON m.id = si.medicine_id WHERE si.sale_id = ?
    `).all(saleId)
    return { sale, items }
  },

  deleteSale(saleId: number, userId: number) {
    const db = getDb()
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any
    if (user?.role !== 'admin') throw new Error('Only administrators can delete sales.')

    const tx = db.transaction(() => {
      // 1. Restore stock
      const items = db.prepare('SELECT batch_id, qty FROM sale_items WHERE sale_id = ?').all(saleId) as any[]
      for (const item of items) {
        db.prepare('UPDATE batches SET qty = qty + ? WHERE id = ?').run(item.qty, item.batch_id)
      }
      
      // 2. Delete related records
      db.prepare('DELETE FROM controlled_register WHERE sale_id = ?').run(saleId)
      db.prepare('DELETE FROM returns WHERE sale_id = ?').run(saleId)
      db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId)
      db.prepare('DELETE FROM sales WHERE id = ?').run(saleId)
      
      // 3. Audit log
      db.prepare(`INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES (?, 'SALE_DELETE', 'sale', ?)`).run(userId, saleId)
    })
    tx()
  }
}