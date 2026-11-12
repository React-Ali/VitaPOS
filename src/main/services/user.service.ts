import bcrypt from 'bcryptjs'
import { getDb } from '../database/connection'

export const userService = {
  list() {
    return getDb().prepare('SELECT id, username, full_name, role, is_active FROM users ORDER BY id ASC').all()
  },
  create(input: any) {
    const hash = bcrypt.hashSync(input.password, 10)
    return getDb().prepare(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`
    ).run(input.username, hash, input.full_name, input.role)
  },
  update(id: number, input: any) {
    const db = getDb()
    if (input.password) {
      const hash = bcrypt.hashSync(input.password, 10)
      db.prepare('UPDATE users SET username=?, full_name=?, role=?, password_hash=? WHERE id=?')
        .run(input.username, input.full_name, input.role, hash, id)
    } else {
      db.prepare('UPDATE users SET username=?, full_name=?, role=? WHERE id=?')
        .run(input.username, input.full_name, input.role, id)
    }
  },
  toggleActive(id: number, isActive: boolean) {
    getDb().prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id)
  },
  delete(id: number) {
    const db = getDb()
    try {
      // Try to delete the user
      db.prepare('DELETE FROM users WHERE id = ?').run(id)
    } catch (error: any) {
      // If the database blocks it because of foreign keys (they have sales, etc.)
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        throw new Error('Cannot delete this user because they have a transaction history (Sales, Invoices, etc.). Please Deactivate them instead to keep your records safe.')
      }
      throw error
    }
  }
}