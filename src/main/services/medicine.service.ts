import { getDb } from '../database/connection'

export const medicineService = {
  search(query: string) {
    const db = getDb()
    const q = `%${query}%`
    return db.prepare(
        `SELECT m.*, 
         COALESCE(SUM(b.qty), 0) AS total_qty,
         MIN(CASE WHEN b.qty > 0 THEN b.expiry_date ELSE NULL END) AS earliest_expiry
         FROM medicines m
         LEFT JOIN batches b ON b.medicine_id = m.id AND b.qty > 0
         WHERE m.is_active = 1 AND (m.name LIKE ? OR m.generic_name LIKE ? OR m.barcode LIKE ?)
         GROUP BY m.id ORDER BY m.name LIMIT 100`
      ).all(q, q, q) as any[]
  },

  listAll() { return this.search('') },

  create(input: any, userId: number): number {
    const db = getDb()
    const cleanBarcode = input.barcode && input.barcode.trim() !== '' ? input.barcode.trim() : null
    const res = db.prepare(
      `INSERT INTO medicines (name, generic_name, brand, category, unit, pack_size, barcode, mrp, purchase_price, schedule, product_type)
       VALUES (@name, @generic_name, @brand, @category, @unit, @pack_size, @barcode, @mrp, @purchase_price, @schedule, @product_type)`
    ).run({ ...input, barcode: cleanBarcode, product_type: input.product_type || 'Human' })
    return Number(res.lastInsertRowid)
  },

  update(id: number, input: any, userId: number): void {
    const db = getDb()
    const cleanBarcode = input.barcode && input.barcode.trim() !== '' ? input.barcode.trim() : null
    db.prepare(
      `UPDATE medicines SET name=@name, generic_name=@generic_name, brand=@brand, 
       category=@category, unit=@unit, pack_size=@pack_size, barcode=@barcode, 
       mrp=@mrp, purchase_price=@purchase_price, schedule=@schedule, product_type=@product_type WHERE id=@id`
    ).run({ ...input, barcode: cleanBarcode, product_type: input.product_type || 'Human', id })
  },

  delete(id: number, userId: number): void {
    getDb().prepare('UPDATE medicines SET is_active = 0 WHERE id = ?').run(id)
  },

  getBatches(medicineId: number) {
    return getDb().prepare(`SELECT id, batch_no, expiry_date, qty, cost_price FROM batches WHERE medicine_id = ? AND qty > 0 ORDER BY expiry_date ASC`).all(medicineId)
  }
}