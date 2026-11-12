import { getDb } from '../database/connection'

export const supplierService = {
  list() {
    return getDb().prepare('SELECT * FROM suppliers ORDER BY name').all()
  },
  create(input: any) {
    return getDb().prepare('INSERT INTO suppliers (name, license_no, phone, address) VALUES (@name, @license_no, @phone, @address)').run(input)
  },
  delete(id: number) {
    try {
      getDb().prepare('DELETE FROM suppliers WHERE id = ?').run(id)
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        throw new Error('Cannot delete supplier because they have purchase history.')
      }
      throw err
    }
  },
  getLedger(supplierId: number) {
    const db = getDb()
    const purchases = db.prepare(`SELECT id, invoice_no, total_amount as amount, paid_amount, created_at, 'Purchase Bill' as type FROM purchases WHERE supplier_id = ?`).all(supplierId)
    const payments = db.prepare(`SELECT id, 'Payment' as invoice_no, amount, 0 as paid_amount, created_at, 'Payment Paid' as type, notes FROM supplier_payments WHERE supplier_id = ?`).all(supplierId)
    const history = [...purchases, ...payments].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const totalPurchased = purchases.reduce((sum: number, p: any) => sum + p.amount, 0)
    const totalPaid = purchases.reduce((sum: number, p: any) => sum + p.paid_amount, 0) + payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    return { history, totalPurchased, totalPaid, balance: totalPurchased - totalPaid }
  },
  addPayment(supplierId: number, amount: number, notes: string) {
    return getDb().prepare('INSERT INTO supplier_payments (supplier_id, amount, notes) VALUES (?, ?, ?)').run(supplierId, amount, notes)
  }
}