import bcrypt from 'bcryptjs'
import { getDb } from './connection'

export function runSeed(): void {
  const db = getDb()
  
  // 1. Check if admin user exists
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (userCount.c === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')`
    ).run('admin', hash, 'System Administrator')
    console.log('[seed] Default admin user created: admin / admin123')
  }

  // 2. Check if medicines exist
  const medCount = db.prepare('SELECT COUNT(*) as c FROM medicines').get() as { c: number }
  if (medCount.c === 0) {
    const insertMed = db.prepare(
      `INSERT INTO medicines (name, generic_name, brand, category, unit, pack_size, mrp, schedule, product_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    insertMed.run('Panadol 500mg', 'Paracetamol', 'GSK', 'Analgesic', 'tablet', 10, 55, 'none', 'Human')
    insertMed.run('Augmentin 625mg', 'Amoxicillin+Clavulanate', 'GSK', 'Antibiotic', 'tablet', 6, 480, 'H', 'Human')
    insertMed.run('Morphine 10mg', 'Morphine Sulfate', 'Generic', 'Narcotic', 'ampoule', 1, 350, 'G', 'Human')
    insertMed.run('Pet Multivitamin', 'Multivitamin', 'VetCare', 'Supplement', 'bottle', 1, 450, 'none', 'Vet')
    insertMed.run('Chocolate Fudge Cake', 'Bakery', 'Local', 'Cake', 'piece', 1, 850, 'none', 'Bakery')

    const insertBatch = db.prepare(
      `INSERT INTO batches (medicine_id, batch_no, expiry_date, qty, cost_price) VALUES (?, ?, ?, ?, ?)`
    )
    // Add some dummy stock to the first 3 items
    insertBatch.run(1, 'PN2024A', '2026-12-31', 500, 40)
    insertBatch.run(2, 'AU2024B', '2026-06-30', 120, 380)
    insertBatch.run(3, 'MO2024C', '2026-03-31', 20, 280)
    insertBatch.run(4, 'VT2024A', '2026-12-31', 50, 300)
    insertBatch.run(5, 'BK2024A', '2024-12-31', 10, 500)
    
    console.log('[seed] Default products and batches created.')
  }

  // 3. Check settings (using INSERT OR IGNORE to prevent crashes)
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('shop_name', 'VitaPOS')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('shop_phone', '0300-1234567')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('shop_address', 'Main Boulevard, Lahore')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('receipt_footer', 'Thank you for your business! Get well soon.')
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run('low_stock_threshold', '10')
}