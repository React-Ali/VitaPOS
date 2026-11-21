import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { getDb } from '../database/connection'

export interface SessionUser {
  id: number
  username: string
  full_name: string
  role: 'admin' | 'pharmacist' | 'cashier'
}

// Clears whenever the app restarts
const loginAttempts = new Map<string, { count: number, lockoutUntil: number }>()
const tempRecoveryCodes = new Map<string, { code: string, expiresAt: number }>()

export const authService = {
  login(username: string, password: string): { token: string; user: SessionUser } {
    const db = getDb()
    
    const attempt = loginAttempts.get(username)
    if (attempt && attempt.lockoutUntil > Date.now()) {
      const minsLeft = Math.ceil((attempt.lockoutUntil - Date.now()) / 60000)
      throw new Error(`Account locked. Try again in ${minsLeft} minute(s).`)
    }

    const row = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as any
      
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      const currentAttempts = attempt ? attempt.count + 1 : 1
      if (currentAttempts >= 5) {
        // REDUCED TO 1 MINUTE SO YOU DON'T GET STUCK
        loginAttempts.set(username, { count: 0, lockoutUntil: Date.now() + 60000 })
        throw new Error('Too many failed attempts. Account locked for 1 minute.')
      } else {
        loginAttempts.set(username, { count: currentAttempts, lockoutUntil: 0 })
        throw new Error('Invalid credentials')
      }
    }

    loginAttempts.delete(username)
    const token = nanoid(32)
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, row.id)
    return { token, user: { id: row.id, username: row.username, full_name: row.full_name, role: row.role } }
  },

  generateRecoveryCode(username: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    tempRecoveryCodes.set(username, { code, expiresAt: Date.now() + 15 * 60000 })
    return code
  },

  resetPassword(username: string, newPassword: string, recoveryKey: string) {
    const db = getDb()
    
    const masterKeyRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('master_recovery_key') as any
    const isMasterFailsafe = masterKeyRow && recoveryKey === masterKeyRow.value
    
    const tempData = tempRecoveryCodes.get(username)
    const isTempValid = tempData && tempData.code === recoveryKey && tempData.expiresAt > Date.now()

    if (!isMasterFailsafe && !isTempValid) {
      throw new Error('Invalid or expired recovery key.')
    }

    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (!user) throw new Error('User not found.')

    const hash = bcrypt.hashSync(newPassword, 10)
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username)
    
    tempRecoveryCodes.delete(username)
    return { success: true }
  },

  logout(token: string): void {
    getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
  },

  getUserByToken(token: string): SessionUser | null {
    return getDb().prepare(
      `SELECT u.id, u.username, u.full_name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    ).get(token) as SessionUser | undefined || null
  }
}