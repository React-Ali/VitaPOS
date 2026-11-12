CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  pmdc_no TEXT,
  hospital TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add doctor_id to controlled register for proper linking
ALTER TABLE controlled_register ADD COLUMN doctor_id INTEGER;