-- Add product type to medicines (Human, Vet, Bakery)
ALTER TABLE medicines ADD COLUMN product_type TEXT DEFAULT 'Human';

-- Add payment tracking to purchases
ALTER TABLE purchases ADD COLUMN paid_amount REAL DEFAULT 0;
ALTER TABLE purchases ADD COLUMN payment_status TEXT DEFAULT 'Paid';

-- Table to track when we pay suppliers later
CREATE TABLE IF NOT EXISTS supplier_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  amount REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);