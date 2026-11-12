import { getDb } from '../database/connection'

/**
 * DRAP MRP enforcement. A pharmacy may NEVER sell above current MRP.
 * Any sale must call this before persisting.
 */
export const mrpService = {
  getMrp(medicineId: number): number {
    const row = getDb().prepare('SELECT mrp FROM medicines WHERE id = ?').get(medicineId) as
      | { mrp: number }
      | undefined
    if (!row) throw new Error(`Medicine ${medicineId} not found`)
    return row.mrp
  },

  assertWithinMrp(medicineId: number, unitPrice: number): void {
    const mrp = this.getMrp(medicineId)
    if (unitPrice > mrp + 0.001) {
      throw new Error(`Sale price Rs.${unitPrice} exceeds DRAP MRP Rs.${mrp}`)
    }
  },

  setMrp(medicineId: number, newMrp: number, userId: number): void {
    const db = getDb()
    db.prepare('UPDATE medicines SET mrp = ? WHERE id = ?').run(newMrp, medicineId)
    db.prepare(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, details)
       VALUES (?, 'MRP_CHANGE', 'medicine', ?, ?)`
    ).run(userId, medicineId, JSON.stringify({ newMrp }))
  }
}