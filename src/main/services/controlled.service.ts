import { getDb } from '../database/connection'

export const controlledService = {
  list(fromDate?: string, toDate?: string) {
    const db = getDb()
    let sql = `
      SELECT cr.*, m.name AS medicine_name, u.full_name AS sold_by
      FROM controlled_register cr
      JOIN medicines m ON m.id = cr.medicine_id
      JOIN sales s ON s.id = cr.sale_id
      JOIN users u ON u.id = s.user_id
      WHERE 1=1`
    const params: any[] = []
    if (fromDate) { sql += ' AND date(cr.created_at) >= ?'; params.push(fromDate) }
    if (toDate) { sql += ' AND date(cr.created_at) <= ?'; params.push(toDate) }
    sql += ' ORDER BY cr.created_at DESC LIMIT 500'
    return db.prepare(sql).all(...params)
  }
}