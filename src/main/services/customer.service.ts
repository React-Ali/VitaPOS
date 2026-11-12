import { getDb } from '../database/connection'

export const customerService = {
  list() {
    return getDb().prepare('SELECT * FROM customers ORDER BY name ASC').all()
  },
  create(input: any) {
    return getDb().prepare(
      'INSERT INTO customers (name, phone, cnic, email, address, notes) VALUES (@name, @phone, @cnic, @email, @address, @notes)'
    ).run(input)
  },
  update(id: number, input: any) {
    return getDb().prepare(
      'UPDATE customers SET name=@name, phone=@phone, cnic=@cnic, email=@email, address=@address, notes=@notes WHERE id=@id'
    ).run({ ...input, id })
  },
  delete(id: number) {
    return getDb().prepare('DELETE FROM customers WHERE id = ?').run(id)
  },
  
  // NEW: Khata Ledger Logic
  getLedger(customerId: number) {
    const db = getDb()
    
    // Get all sales on credit
    const sales = db.prepare(`
      SELECT id, invoice_no, total as amount, created_at, 'Credit Sale' as type 
      FROM sales WHERE customer_id = ? AND payment_status = 'Credit'
    `).all(customerId)
    
    // Get all payments made by customer
    const payments = db.prepare(`
      SELECT id, 'Payment' as invoice_no, amount, created_at, 'Payment Received' as type, notes
      FROM customer_payments WHERE customer_id = ?
    `).all(customerId)

    // Combine and sort by date
    const history = [...sales, ...payments].sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const totalCredit = sales.reduce((sum: number, s: any) => sum + s.amount, 0)
    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    const balance = totalCredit - totalPaid

    return { history, totalCredit, totalPaid, balance }
  },

  addPayment(customerId: number, amount: number, notes: string, date: string) {
    return getDb().prepare(
      'INSERT INTO customer_payments (customer_id, amount, notes, date) VALUES (?, ?, ?, ?)'
    ).run(customerId, amount, notes, date)
  }
}