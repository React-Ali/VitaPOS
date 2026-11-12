-- Add payment status to sales
ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT 'Paid';
ALTER TABLE sales ADD COLUMN paid_amount REAL DEFAULT 0;

-- Add credit limit to customers
ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 50000;

-- Table to track when customers pay off their debt
CREATE TABLE IF NOT EXISTS customer_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);