import { getDb } from '../database/connection'

export const settingsService = {
  getAll() {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[]
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {})
  },
  update(key: string, value: string) {
    getDb().prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value)
  }
}