import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { getDb } from './connection'

export function runSeed(): void {
  const db = getDb()
  
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (userCount.c === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')`
    ).run('admin', hash, 'System Administrator')
    console.log('[seed] Default admin user created: admin / admin123')
  }

  const medCount = db.prepare('SELECT COUNT(*) as c FROM medicines').get() as { c: number }
  if (medCount.c === 0) {
    // ... (keep your existing medicine seed code here) ...
  }

  // Generate a unique Master Key for THIS specific installation if it doesn't exist
  const keyCheck = db.prepare('SELECT value FROM settings WHERE key = ?').get('master_recovery_key')
  if (!keyCheck) {
    const uniqueMasterKey = `VITA-${nanoid(4).toUpperCase()}-${nanoid(4).toUpperCase()}-${nanoid(4).toUpperCase()}`
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('master_recovery_key', uniqueMasterKey)
    console.log('[seed] Unique Master Recovery Key generated:', uniqueMasterKey)
  }

  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('shop_name', 'VitaPOS')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('shop_phone', '0300-1234567')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('shop_address', 'Main Boulevard, Lahore')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('receipt_footer', 'Thank you for your business! Get well soon.')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('low_stock_threshold', '10')
}