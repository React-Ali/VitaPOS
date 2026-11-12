import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { getDb } from '../database/connection'

export interface SessionUser {
  id: number
  username: string
  full_name: string
  role: 'admin' | 'pharmacist' | 'cashier'
}

export const authService = {
  login(username: string, password: string): { token: string; user: SessionUser } {
    const db = getDb()
    const row = db
      .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
      .get(username) as any
    if (!row) throw new Error('Invalid credentials')
    if (!bcrypt.compareSync(password, row.password_hash)) throw new Error('Invalid credentials')

    const token = nanoid(32)
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, row.id)
    return {
      token,
      user: { id: row.id, username: row.username, full_name: row.full_name, role: row.role }
    }
  },

  logout(token: string): void {
    getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
  },

  getUserByToken(token: string): SessionUser | null {
    const row = getDb()
      .prepare(
        `SELECT u.id, u.username, u.full_name, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ?`
      )
      .get(token) as SessionUser | undefined
    return row ?? null
  }
}