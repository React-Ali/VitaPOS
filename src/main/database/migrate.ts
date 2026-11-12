import { getDb } from './connection'
import migration001 from './migrations/001_initial_schema.sql?raw'
import migration002 from './migrations/002_essentials.sql?raw'
import migration003 from './migrations/003_settings.sql?raw'
import migration004 from './migrations/004_advanced.sql?raw'
import migration005 from './migrations/005_returns.sql?raw'
import migration006 from './migrations/006_adjustments.sql?raw'
import migration007 from './migrations/007_doctors.sql?raw'
import migration008 from './migrations/008_fix_doctors.sql?raw'
import migration009 from './migrations/009_extra_details.sql?raw'
import migration010 from './migrations/010_credit_system.sql?raw'
import migration011 from './migrations/011_medicine_cost.sql?raw'
import migration012 from './migrations/012_product_type_and_suppliers.sql?raw'

const MIGRATIONS = [
  { id: 1, sql: migration001 },
  { id: 2, sql: migration002 },
  { id: 3, sql: migration003 },
  { id: 4, sql: migration004 },
  { id: 5, sql: migration005 },
  { id: 6, sql: migration006 },
  { id: 7, sql: migration007 },
  { id: 8, sql: migration008 },
  { id: 9, sql: migration009 },
  { id: 10, sql: migration010 },
  { id: 11, sql: migration011 },
  { id: 12, sql: migration012 }
]

export function runMigrations(): void {
  const db = getDb()
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, applied_at TEXT)`)
  const applied = new Set<number>(
    db.prepare('SELECT id FROM _migrations').all().map((r: any) => r.id)
  )

  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue
    const tx = db.transaction(() => {
      db.exec(m.sql)
      db.prepare('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)').run(m.id, new Date().toISOString())
    })
    tx()
    console.log(`[migrate] applied ${m.id}`)
  }
}