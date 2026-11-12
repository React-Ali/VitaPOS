import { getDb } from '../database/connection'

export const auditService = {
  getLogs() {
    return getDb().prepare(`
      SELECT a.*, u.full_name, u.username 
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.id DESC LIMIT 200
    `).all()
  }
}