"use strict";
const electron = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const nanoid = require("nanoid");
const log = require("electron-log/main");
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({
        openAtLogin: auto,
        path: process.execPath
      });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    electron.ipcMain.on("win:invoke", (event, action) => {
      const win = electron.BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    icon,
    // <--- THIS LINE IS CRITICAL
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.on("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  return win;
}
let db;
function initDatabase() {
  const dir = electron.app.getPath("userData");
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, "nms.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}
const migration001 = "CREATE TABLE users (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  username TEXT NOT NULL UNIQUE,\n  password_hash TEXT NOT NULL,\n  full_name TEXT NOT NULL,\n  role TEXT NOT NULL CHECK (role IN ('admin','pharmacist','cashier')),\n  is_active INTEGER NOT NULL DEFAULT 1,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE medicines (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  generic_name TEXT,\n  brand TEXT,\n  category TEXT,\n  unit TEXT NOT NULL DEFAULT 'tablet',\n  pack_size INTEGER NOT NULL DEFAULT 1,\n  barcode TEXT UNIQUE,\n  mrp REAL NOT NULL DEFAULT 0,\n  schedule TEXT NOT NULL DEFAULT 'none' CHECK (schedule IN ('none','G','D','H')),\n  is_active INTEGER NOT NULL DEFAULT 1,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\nCREATE INDEX idx_medicines_name ON medicines(name);\n\nCREATE TABLE suppliers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  license_no TEXT,\n  phone TEXT,\n  address TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE batches (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  medicine_id INTEGER NOT NULL REFERENCES medicines(id),\n  batch_no TEXT NOT NULL,\n  expiry_date TEXT NOT NULL,\n  qty INTEGER NOT NULL DEFAULT 0,\n  cost_price REAL NOT NULL DEFAULT 0,\n  supplier_id INTEGER REFERENCES suppliers(id),\n  received_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\nCREATE INDEX idx_batches_med ON batches(medicine_id, expiry_date);\n\nCREATE TABLE customers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  phone TEXT,\n  cnic TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE doctors (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  pmdc_no TEXT,\n  phone TEXT\n);\n\nCREATE TABLE sales (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  invoice_no TEXT NOT NULL UNIQUE,\n  user_id INTEGER NOT NULL REFERENCES users(id),\n  customer_id INTEGER REFERENCES customers(id),\n  subtotal REAL NOT NULL,\n  discount REAL NOT NULL DEFAULT 0,\n  total REAL NOT NULL,\n  payment_method TEXT NOT NULL DEFAULT 'cash',\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE sale_items (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,\n  medicine_id INTEGER NOT NULL REFERENCES medicines(id),\n  batch_id INTEGER NOT NULL REFERENCES batches(id),\n  qty INTEGER NOT NULL,\n  unit_price REAL NOT NULL,\n  line_total REAL NOT NULL\n);\n\nCREATE TABLE controlled_register (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  sale_id INTEGER NOT NULL REFERENCES sales(id),\n  medicine_id INTEGER NOT NULL REFERENCES medicines(id),\n  batch_no TEXT NOT NULL,\n  qty INTEGER NOT NULL,\n  customer_cnic TEXT NOT NULL,\n  doctor_name TEXT NOT NULL,\n  doctor_pmdc TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE audit_log (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER,\n  action TEXT NOT NULL,\n  entity TEXT,\n  entity_id INTEGER,\n  details TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE settings (\n  key TEXT PRIMARY KEY,\n  value TEXT\n);\n\nCREATE TABLE sessions (\n  token TEXT PRIMARY KEY,\n  user_id INTEGER NOT NULL REFERENCES users(id),\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n";
const migration002 = "CREATE TABLE IF NOT EXISTS suppliers (\r\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\r\n  name TEXT NOT NULL,\r\n  license_no TEXT,\r\n  phone TEXT,\r\n  address TEXT,\r\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\r\n);\r\n\r\nCREATE TABLE IF NOT EXISTS purchases (\r\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\r\n  supplier_id INTEGER REFERENCES suppliers(id),\r\n  invoice_no TEXT NOT NULL,\r\n  total_amount REAL NOT NULL,\r\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\r\n);";
const migration003 = "INSERT OR IGNORE INTO settings (key, value) VALUES \n('shop_name', 'VitaPOS'),\n('shop_phone', '0300-1234567'),\n('shop_address', 'Main Boulevard, Lahore'),\n('receipt_footer', 'Thank you for your business! Get well soon.');";
const migration004 = "CREATE TABLE IF NOT EXISTS customers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  phone TEXT,\n  cnic TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE IF NOT EXISTS expenses (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  category TEXT NOT NULL,\n  amount REAL NOT NULL,\n  description TEXT,\n  date TEXT NOT NULL,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);";
const migration005 = "CREATE TABLE IF NOT EXISTS returns (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  sale_id INTEGER NOT NULL REFERENCES sales(id),\n  user_id INTEGER NOT NULL REFERENCES users(id),\n  total_refund REAL NOT NULL,\n  reason TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\nCREATE TABLE IF NOT EXISTS return_items (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,\n  sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),\n  medicine_id INTEGER NOT NULL REFERENCES medicines(id),\n  batch_id INTEGER NOT NULL REFERENCES batches(id),\n  qty INTEGER NOT NULL,\n  refund_amount REAL NOT NULL\n);";
const migration006 = "CREATE TABLE IF NOT EXISTS stock_adjustments (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  batch_id INTEGER NOT NULL REFERENCES batches(id),\n  qty INTEGER NOT NULL,\n  type TEXT NOT NULL, -- 'supplier_return', 'expired', 'damaged'\n  notes TEXT,\n  user_id INTEGER NOT NULL REFERENCES users(id),\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);";
const migration007 = "CREATE TABLE IF NOT EXISTS doctors (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  pmdc_no TEXT,\n  hospital TEXT,\n  phone TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\n\n-- Add doctor_id to controlled register for proper linking\nALTER TABLE controlled_register ADD COLUMN doctor_id INTEGER;";
const migration008 = "ALTER TABLE doctors ADD COLUMN hospital TEXT;";
const migration009 = "ALTER TABLE customers ADD COLUMN email TEXT;\nALTER TABLE customers ADD COLUMN address TEXT;\nALTER TABLE customers ADD COLUMN notes TEXT;\n\nALTER TABLE doctors ADD COLUMN specialty TEXT;\nALTER TABLE doctors ADD COLUMN email TEXT;\nALTER TABLE doctors ADD COLUMN notes TEXT;";
const migration010 = "-- Add payment status to sales\nALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT 'Paid';\nALTER TABLE sales ADD COLUMN paid_amount REAL DEFAULT 0;\n\n-- Add credit limit to customers\nALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 50000;\n\n-- Table to track when customers pay off their debt\nCREATE TABLE IF NOT EXISTS customer_payments (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  customer_id INTEGER NOT NULL REFERENCES customers(id),\n  amount REAL NOT NULL,\n  date TEXT NOT NULL,\n  notes TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);";
const migration011 = "ALTER TABLE medicines ADD COLUMN purchase_price REAL DEFAULT 0;";
const migration012 = "-- Add product type to medicines (Human, Vet, Bakery)\nALTER TABLE medicines ADD COLUMN product_type TEXT DEFAULT 'Human';\n\n-- Add payment tracking to purchases\nALTER TABLE purchases ADD COLUMN paid_amount REAL DEFAULT 0;\nALTER TABLE purchases ADD COLUMN payment_status TEXT DEFAULT 'Paid';\n\n-- Table to track when we pay suppliers later\nCREATE TABLE IF NOT EXISTS supplier_payments (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),\n  amount REAL NOT NULL,\n  notes TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);";
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
];
function runMigrations() {
  const db2 = getDb();
  db2.exec(`CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, applied_at TEXT)`);
  const applied = new Set(
    db2.prepare("SELECT id FROM _migrations").all().map((r) => r.id)
  );
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    const tx = db2.transaction(() => {
      db2.exec(m.sql);
      db2.prepare("INSERT INTO _migrations (id, applied_at) VALUES (?, ?)").run(m.id, (/* @__PURE__ */ new Date()).toISOString());
    });
    tx();
    console.log(`[migrate] applied ${m.id}`);
  }
}
function runSeed() {
  const db2 = getDb();
  const userCount = db2.prepare("SELECT COUNT(*) as c FROM users").get();
  if (userCount.c === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    db2.prepare(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')`
    ).run("admin", hash, "System Administrator");
    console.log("[seed] Default admin user created: admin / admin123");
  }
  const medCount = db2.prepare("SELECT COUNT(*) as c FROM medicines").get();
  if (medCount.c === 0) {
    const insertMed = db2.prepare(
      `INSERT INTO medicines (name, generic_name, brand, category, unit, pack_size, mrp, schedule, product_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertMed.run("Panadol 500mg", "Paracetamol", "GSK", "Analgesic", "tablet", 10, 55, "none", "Human");
    insertMed.run("Augmentin 625mg", "Amoxicillin+Clavulanate", "GSK", "Antibiotic", "tablet", 6, 480, "H", "Human");
    insertMed.run("Morphine 10mg", "Morphine Sulfate", "Generic", "Narcotic", "ampoule", 1, 350, "G", "Human");
    insertMed.run("Pet Multivitamin", "Multivitamin", "VetCare", "Supplement", "bottle", 1, 450, "none", "Vet");
    insertMed.run("Chocolate Fudge Cake", "Bakery", "Local", "Cake", "piece", 1, 850, "none", "Bakery");
    const insertBatch = db2.prepare(
      `INSERT INTO batches (medicine_id, batch_no, expiry_date, qty, cost_price) VALUES (?, ?, ?, ?, ?)`
    );
    insertBatch.run(1, "PN2024A", "2026-12-31", 500, 40);
    insertBatch.run(2, "AU2024B", "2026-06-30", 120, 380);
    insertBatch.run(3, "MO2024C", "2026-03-31", 20, 280);
    insertBatch.run(4, "VT2024A", "2026-12-31", 50, 300);
    insertBatch.run(5, "BK2024A", "2024-12-31", 10, 500);
    console.log("[seed] Default products and batches created.");
  }
  db2.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run("shop_name", "VitaPOS");
  db2.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run("shop_phone", "0300-1234567");
  db2.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run("shop_address", "Main Boulevard, Lahore");
  db2.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run("receipt_footer", "Thank you for your business! Get well soon.");
  db2.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`).run("low_stock_threshold", "10");
}
const authService = {
  login(username, password) {
    const db2 = getDb();
    const row = db2.prepare("SELECT * FROM users WHERE username = ? AND is_active = 1").get(username);
    if (!row) throw new Error("Invalid credentials");
    if (!bcrypt.compareSync(password, row.password_hash)) throw new Error("Invalid credentials");
    const token = nanoid.nanoid(32);
    db2.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, row.id);
    return {
      token,
      user: { id: row.id, username: row.username, full_name: row.full_name, role: row.role }
    };
  },
  logout(token) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  },
  getUserByToken(token) {
    const row = getDb().prepare(
      `SELECT u.id, u.username, u.full_name, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ?`
    ).get(token);
    return row ?? null;
  }
};
const medicineService = {
  search(query) {
    const db2 = getDb();
    const q = `%${query}%`;
    return db2.prepare(
      `SELECT m.*, 
         COALESCE(SUM(b.qty), 0) AS total_qty,
         MIN(CASE WHEN b.qty > 0 THEN b.expiry_date ELSE NULL END) AS earliest_expiry
         FROM medicines m
         LEFT JOIN batches b ON b.medicine_id = m.id AND b.qty > 0
         WHERE m.is_active = 1 AND (m.name LIKE ? OR m.generic_name LIKE ? OR m.barcode LIKE ?)
         GROUP BY m.id ORDER BY m.name LIMIT 100`
    ).all(q, q, q);
  },
  listAll() {
    return this.search("");
  },
  create(input, userId) {
    const db2 = getDb();
    const cleanBarcode = input.barcode && input.barcode.trim() !== "" ? input.barcode.trim() : null;
    const res = db2.prepare(
      `INSERT INTO medicines (name, generic_name, brand, category, unit, pack_size, barcode, mrp, purchase_price, schedule, product_type)
       VALUES (@name, @generic_name, @brand, @category, @unit, @pack_size, @barcode, @mrp, @purchase_price, @schedule, @product_type)`
    ).run({ ...input, barcode: cleanBarcode, product_type: input.product_type || "Human" });
    return Number(res.lastInsertRowid);
  },
  update(id, input, userId) {
    const db2 = getDb();
    const cleanBarcode = input.barcode && input.barcode.trim() !== "" ? input.barcode.trim() : null;
    db2.prepare(
      `UPDATE medicines SET name=@name, generic_name=@generic_name, brand=@brand, 
       category=@category, unit=@unit, pack_size=@pack_size, barcode=@barcode, 
       mrp=@mrp, purchase_price=@purchase_price, schedule=@schedule, product_type=@product_type WHERE id=@id`
    ).run({ ...input, barcode: cleanBarcode, product_type: input.product_type || "Human", id });
  },
  delete(id, userId) {
    getDb().prepare("UPDATE medicines SET is_active = 0 WHERE id = ?").run(id);
  },
  getBatches(medicineId) {
    return getDb().prepare(`SELECT id, batch_no, expiry_date, qty, cost_price FROM batches WHERE medicine_id = ? AND qty > 0 ORDER BY expiry_date ASC`).all(medicineId);
  }
};
const mrpService = {
  getMrp(medicineId) {
    const row = getDb().prepare("SELECT mrp FROM medicines WHERE id = ?").get(medicineId);
    if (!row) throw new Error(`Medicine ${medicineId} not found`);
    return row.mrp;
  },
  assertWithinMrp(medicineId, unitPrice) {
    const mrp = this.getMrp(medicineId);
    if (unitPrice > mrp + 1e-3) {
      throw new Error(`Sale price Rs.${unitPrice} exceeds DRAP MRP Rs.${mrp}`);
    }
  },
  setMrp(medicineId, newMrp, userId) {
    const db2 = getDb();
    db2.prepare("UPDATE medicines SET mrp = ? WHERE id = ?").run(newMrp, medicineId);
    db2.prepare(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, details)
       VALUES (?, 'MRP_CHANGE', 'medicine', ?, ?)`
    ).run(userId, medicineId, JSON.stringify({ newMrp }));
  }
};
const salesService = {
  create(input, userId) {
    const db2 = getDb();
    if (!input.items.length) throw new Error("Cart is empty");
    const hasControlled = input.items.some((i) => i.schedule === "G" || i.schedule === "D");
    if (hasControlled && (!input.customerCnic?.trim() || !input.doctorId)) {
      throw new Error("CNIC and Doctor required for controlled drugs");
    }
    const tx = db2.transaction(() => {
      const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA").replace(/-/g, "");
      const prefix = `NMS-${today}-`;
      const last = db2.prepare(`SELECT invoice_no FROM sales WHERE invoice_no LIKE ? ORDER BY id DESC LIMIT 1`).get(`${prefix}%`);
      const seq = last ? Number(last.invoice_no.split("-").pop()) + 1 : 1;
      const invoiceNo = `${prefix}${String(seq).padStart(4, "0")}`;
      let subtotal = 0;
      for (const item of input.items) {
        mrpService.assertWithinMrp(item.medicineId, item.unitPrice);
        const batch = db2.prepare("SELECT qty, batch_no, expiry_date FROM batches WHERE id = ?").get(item.batchId);
        if (!batch) throw new Error(`Batch not found`);
        if (batch.expiry_date < (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) throw new Error(`Batch ${batch.batch_no} is expired`);
        if (batch.qty < item.qty) throw new Error(`Insufficient stock in batch ${batch.batch_no}`);
        subtotal += item.unitPrice * item.qty;
      }
      const total = subtotal - (input.discount || 0);
      const paidAmount = input.paymentMethod === "Credit" ? 0 : total;
      const saleRes = db2.prepare(
        `INSERT INTO sales (invoice_no, user_id, customer_id, subtotal, discount, total, payment_method, payment_status, paid_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(invoiceNo, userId, input.customerId || null, subtotal, input.discount || 0, total, input.paymentMethod || "Cash", input.paymentMethod === "Credit" ? "Credit" : "Paid", paidAmount);
      const saleId = Number(saleRes.lastInsertRowid);
      const insertItem = db2.prepare(`INSERT INTO sale_items (sale_id, medicine_id, batch_id, qty, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)`);
      const updateBatch = db2.prepare("UPDATE batches SET qty = qty - ? WHERE id = ?");
      for (const item of input.items) {
        insertItem.run(saleId, item.medicineId, item.batchId, item.qty, item.unitPrice, item.unitPrice * item.qty);
        updateBatch.run(item.qty, item.batchId);
        if (item.schedule === "G" || item.schedule === "D") {
          const bNo = db2.prepare("SELECT batch_no FROM batches WHERE id = ?").get(item.batchId);
          db2.prepare(`INSERT INTO controlled_register (sale_id, medicine_id, batch_no, qty, customer_cnic, doctor_id, doctor_name) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(saleId, item.medicineId, bNo.batch_no, item.qty, input.customerCnic, input.doctorId, input.doctorName);
        }
      }
      return { id: saleId, invoiceNo, total };
    });
    return tx();
  },
  getHistory() {
    return getDb().prepare(`
      SELECT s.*, c.name as customer_name, u.full_name as cashier 
      FROM sales s 
      LEFT JOIN customers c ON c.id = s.customer_id 
      JOIN users u ON u.id = s.user_id
      ORDER BY s.id DESC LIMIT 100
    `).all();
  },
  getSaleDetails(saleId) {
    const db2 = getDb();
    const sale = db2.prepare(`SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE s.id = ?`).get(saleId);
    const items = db2.prepare(`
      SELECT si.*, m.name as medicine_name 
      FROM sale_items si JOIN medicines m ON m.id = si.medicine_id WHERE si.sale_id = ?
    `).all(saleId);
    return { sale, items };
  },
  deleteSale(saleId, userId) {
    const db2 = getDb();
    const user = db2.prepare("SELECT role FROM users WHERE id = ?").get(userId);
    if (user?.role !== "admin") throw new Error("Only administrators can delete sales.");
    const tx = db2.transaction(() => {
      const items = db2.prepare("SELECT batch_id, qty FROM sale_items WHERE sale_id = ?").all(saleId);
      for (const item of items) {
        db2.prepare("UPDATE batches SET qty = qty + ? WHERE id = ?").run(item.qty, item.batch_id);
      }
      db2.prepare("DELETE FROM controlled_register WHERE sale_id = ?").run(saleId);
      db2.prepare("DELETE FROM returns WHERE sale_id = ?").run(saleId);
      db2.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(saleId);
      db2.prepare("DELETE FROM sales WHERE id = ?").run(saleId);
      db2.prepare(`INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES (?, 'SALE_DELETE', 'sale', ?)`).run(userId, saleId);
    });
    tx();
  }
};
const inventoryService = {
  addStock(input, userId) {
    const db2 = getDb();
    const qty = Number(input.qty) || 0;
    const costPrice = Number(input.costPrice) || Number(input.cost_price) || 0;
    const totalAmount = qty * costPrice;
    const paidAmount = input.paidAmount !== void 0 ? Number(input.paidAmount) : totalAmount;
    const paymentStatus = paidAmount >= totalAmount ? "Paid" : paidAmount > 0 ? "Partial" : "Credit";
    if (qty <= 0) throw new Error("Quantity must be greater than 0");
    const tx = db2.transaction(() => {
      db2.prepare(`INSERT INTO purchases (supplier_id, invoice_no, total_amount, paid_amount, payment_status) VALUES (?, ?, ?, ?, ?)`).run(input.supplierId || null, input.invoiceNo || "Manual Entry", totalAmount, paidAmount, paymentStatus);
      const existing = db2.prepare("SELECT id FROM batches WHERE medicine_id = ? AND batch_no = ?").get(input.medicineId, input.batchNo);
      if (existing) {
        db2.prepare("UPDATE batches SET qty = qty + ?, expiry_date = ? WHERE id = ?").run(qty, input.expiryDate, existing.id);
      } else {
        db2.prepare(`INSERT INTO batches (medicine_id, batch_no, expiry_date, qty, cost_price, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`).run(input.medicineId, input.batchNo, input.expiryDate, qty, costPrice, input.supplierId || null);
      }
    });
    tx();
  },
  getPurchaseHistory() {
    return getDb().prepare(`SELECT p.*, s.name as supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.id DESC`).all();
  },
  updateBatch(batchId, input) {
    getDb().prepare(`UPDATE batches SET batch_no=?, expiry_date=?, qty=?, cost_price=? WHERE id=?`).run(input.batch_no, input.expiry_date, Number(input.qty) || 0, Number(input.cost_price) || 0, batchId);
  },
  deleteBatch(batchId) {
    getDb().prepare("DELETE FROM batches WHERE id = ?").run(batchId);
  },
  adjustStock(batchId, qty, type, notes, userId) {
    const db2 = getDb();
    const batch = db2.prepare("SELECT qty FROM batches WHERE id = ?").get(batchId);
    if (!batch || batch.qty < qty) throw new Error("Not enough stock to remove.");
    db2.prepare("UPDATE batches SET qty = qty - ? WHERE id = ?").run(qty, batchId);
    db2.prepare(`INSERT INTO stock_adjustments (batch_id, qty, type, notes, user_id) VALUES (?, ?, ?, ?, ?)`).run(batchId, qty, type, notes, userId);
  },
  getLowStock() {
    const db2 = getDb();
    const thresholdRow = db2.prepare("SELECT value FROM settings WHERE key = ?").get("low_stock_threshold");
    const threshold = thresholdRow ? Number(thresholdRow.value) : 10;
    return db2.prepare(`SELECT m.id, m.name, m.mrp, COALESCE(SUM(b.qty), 0) AS qty FROM medicines m LEFT JOIN batches b ON b.medicine_id = m.id WHERE m.is_active = 1 GROUP BY m.id HAVING COALESCE(SUM(b.qty), 0) <= ? ORDER BY COALESCE(SUM(b.qty), 0) ASC`).all(threshold);
  },
  getExpiring() {
    return getDb().prepare(`SELECT b.id, b.batch_no, b.expiry_date, b.qty, m.name as medicine_name FROM batches b JOIN medicines m ON m.id = b.medicine_id WHERE b.qty > 0 AND date(b.expiry_date) <= date('now', '+90 days') AND m.is_active = 1 ORDER BY b.expiry_date ASC`).all();
  },
  getReturnHistory() {
    return getDb().prepare(`
      SELECT sa.*, b.batch_no, m.name as medicine_name, u.full_name as user_name
      FROM stock_adjustments sa
      JOIN batches b ON b.id = sa.batch_id
      JOIN medicines m ON m.id = b.medicine_id
      JOIN users u ON u.id = sa.user_id
      WHERE sa.type = 'supplier_return' OR sa.type = 'expired' OR sa.type = 'damaged'
      ORDER BY sa.id DESC
    `).all();
  }
};
const dashboardService = {
  stats() {
    const db2 = getDb();
    const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
    const thresholdRow = db2.prepare("SELECT value FROM settings WHERE key = ?").get("low_stock_threshold");
    const threshold = thresholdRow ? Number(thresholdRow.value) : 10;
    const salesToday = db2.prepare(`
      SELECT COALESCE(SUM(total), 0) AS amount, COUNT(*) AS count 
      FROM sales WHERE date(created_at, 'localtime') = ?
    `).get(today);
    const refundsToday = db2.prepare(`
      SELECT COALESCE(SUM(total_refund), 0) AS amount 
      FROM returns WHERE date(created_at, 'localtime') = ?
    `).get(today);
    const netRevenue = salesToday.amount - refundsToday.amount;
    const totalMedicines = db2.prepare("SELECT COUNT(*) AS c FROM medicines WHERE is_active = 1").get().c;
    const lowStock = db2.prepare(`SELECT COUNT(*) AS c FROM (SELECT m.id FROM medicines m LEFT JOIN batches b ON b.medicine_id = m.id WHERE m.is_active = 1 GROUP BY m.id HAVING COALESCE(SUM(b.qty), 0) <= ?)`).get(threshold).c;
    const expiringSoon = db2.prepare(`SELECT COUNT(*) AS c FROM batches WHERE qty > 0 AND date(expiry_date) <= date('now', '+90 days', 'localtime')`).get().c;
    const totalCustomers = db2.prepare("SELECT COUNT(*) AS c FROM customers").get().c;
    const topSelling = db2.prepare(`
      SELECT m.name, SUM(si.qty) as total_qty 
      FROM sale_items si JOIN medicines m ON m.id = si.medicine_id JOIN sales s ON s.id = si.sale_id 
      WHERE date(s.created_at, 'localtime') >= date('now', '-30 days', 'localtime') GROUP BY m.id ORDER BY total_qty DESC LIMIT 5
    `).all();
    const salesTrend = db2.prepare(`
      SELECT 
        date(created_at, 'localtime') as date, 
        COALESCE(SUM(total), 0) as sales 
      FROM sales 
      WHERE date(created_at, 'localtime') >= date('now', '-7 days', 'localtime')
      GROUP BY date 
      ORDER BY date ASC
    `).all();
    return {
      salesToday: { amount: netRevenue, count: salesToday.count },
      refundsToday: refundsToday.amount,
      totalMedicines,
      lowStock,
      expiringSoon,
      totalCustomers,
      topSelling,
      salesTrend
    };
  },
  getAlerts() {
    const db2 = getDb();
    const thresholdRow = db2.prepare("SELECT value FROM settings WHERE key = ?").get("low_stock_threshold");
    const threshold = thresholdRow ? Number(thresholdRow.value) : 10;
    const lowStockItems = db2.prepare(`
      SELECT m.name, COALESCE(SUM(b.qty), 0) AS qty 
      FROM medicines m LEFT JOIN batches b ON b.medicine_id = m.id 
      WHERE m.is_active = 1
      GROUP BY m.id HAVING COALESCE(SUM(b.qty), 0) <= ? ORDER BY COALESCE(SUM(b.qty), 0) ASC LIMIT 10
    `).all(threshold);
    const expiringItems = db2.prepare(`
      SELECT b.batch_no, b.expiry_date, b.qty, m.name as medicine_name 
      FROM batches b JOIN medicines m ON m.id = b.medicine_id 
      WHERE b.qty > 0 AND date(b.expiry_date) <= date('now', '+90 days', 'localtime') AND m.is_active = 1
      ORDER BY b.expiry_date ASC LIMIT 10
    `).all();
    return { lowStockItems, expiringItems };
  }
};
const userService = {
  list() {
    return getDb().prepare("SELECT id, username, full_name, role, is_active FROM users ORDER BY id ASC").all();
  },
  create(input) {
    const hash = bcrypt.hashSync(input.password, 10);
    return getDb().prepare(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`
    ).run(input.username, hash, input.full_name, input.role);
  },
  update(id, input) {
    const db2 = getDb();
    if (input.password) {
      const hash = bcrypt.hashSync(input.password, 10);
      db2.prepare("UPDATE users SET username=?, full_name=?, role=?, password_hash=? WHERE id=?").run(input.username, input.full_name, input.role, hash, id);
    } else {
      db2.prepare("UPDATE users SET username=?, full_name=?, role=? WHERE id=?").run(input.username, input.full_name, input.role, id);
    }
  },
  toggleActive(id, isActive) {
    getDb().prepare("UPDATE users SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, id);
  },
  delete(id) {
    const db2 = getDb();
    try {
      db2.prepare("DELETE FROM users WHERE id = ?").run(id);
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        throw new Error("Cannot delete this user because they have a transaction history (Sales, Invoices, etc.). Please Deactivate them instead to keep your records safe.");
      }
      throw error;
    }
  }
};
const settingsService = {
  getAll() {
    const rows = getDb().prepare("SELECT key, value FROM settings").all();
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  },
  update(key, value) {
    getDb().prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
  }
};
function createPrintWindow(htmlContent, isA4) {
  const tempFile = path.join(electron.app.getPath("temp"), `print_${Date.now()}.html`);
  fs.writeFileSync(tempFile, htmlContent, "utf8");
  const win = new electron.BrowserWindow({
    width: isA4 ? 1e3 : 400,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: { offscreen: true }
    // Renders faster
  });
  win.loadFile(tempFile);
  win.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      win.webContents.print({
        silent: false,
        // Shows the Windows dialog so you can pick the printer
        printBackground: true,
        // 80mm width = 80,000 microns. Height 297mm = 297,000 microns
        pageSize: isA4 ? "A4" : { width: 8e4, height: 297e3 },
        margins: { marginType: "none" },
        scaleFactor: 100
      }, (success, failureReason) => {
        if (!success) console.log("Print failed:", failureReason);
        win.close();
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
        }
      });
    }, 500);
  });
}
function printReceipt(htmlContent) {
  createPrintWindow(htmlContent, false);
}
function printA4(htmlContent) {
  createPrintWindow(htmlContent, true);
}
const reportService = {
  getSalesReport(startDate, endDate) {
    const db2 = getDb();
    const sales = db2.prepare(`
      SELECT s.*, u.full_name as cashier 
      FROM sales s JOIN users u ON u.id = s.user_id 
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
      ORDER BY s.id DESC
    `).all(startDate, endDate);
    const summary = db2.prepare(`
      SELECT COUNT(id) as total_tx, COALESCE(SUM(total), 0) as total_amount 
      FROM sales WHERE date(created_at) >= ? AND date(created_at) <= ?
    `).get(startDate, endDate);
    return { sales, summary };
  },
  getProfitReport(startDate, endDate) {
    const db2 = getDb();
    const profitData = db2.prepare(`
      SELECT 
        m.name,
        SUM(si.qty) as qty_sold,
        SUM(si.line_total) as total_revenue,
        SUM(CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty) as total_cost,
        SUM(si.line_total - (CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty)) as total_profit
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN batches b ON b.id = si.batch_id
      JOIN medicines m ON m.id = si.medicine_id
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
      GROUP BY m.id
      ORDER BY total_profit DESC
    `).all(startDate, endDate);
    const overallSummary = db2.prepare(`
      SELECT 
        SUM(si.line_total) as total_revenue,
        SUM(CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty) as total_cost,
        SUM(si.line_total - (CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END * si.qty)) as total_profit
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN batches b ON b.id = si.batch_id
      JOIN medicines m ON m.id = si.medicine_id
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
    `).get(startDate, endDate);
    return { profitData, overallSummary };
  },
  getProfitAndLoss(startDate, endDate) {
    const db2 = getDb();
    const revRow = db2.prepare(`
      SELECT COALESCE(SUM(total), 0) as revenue 
      FROM sales WHERE date(created_at) >= ? AND date(created_at) <= ?
    `).get(startDate, endDate);
    const cogsRow = db2.prepare(`
      SELECT COALESCE(SUM(
        (CASE WHEN b.cost_price > 0 THEN b.cost_price ELSE m.purchase_price END) * si.qty
      ), 0) as cogs
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN batches b ON b.id = si.batch_id
      JOIN medicines m ON m.id = si.medicine_id
      WHERE date(s.created_at) >= ? AND date(s.created_at) <= ?
    `).get(startDate, endDate);
    const expRow = db2.prepare(`
      SELECT COALESCE(SUM(amount), 0) as expenses 
      FROM expenses WHERE date BETWEEN ? AND ?
    `).get(startDate, endDate);
    const revenue = revRow.revenue || 0;
    const cogs = cogsRow.cogs || 0;
    const expenses = expRow.expenses || 0;
    const netProfit = revenue - cogs - expenses;
    return { revenue, cogs, expenses, netProfit };
  }
};
const returnsService = {
  getSaleForReturn(invoiceNo) {
    const db2 = getDb();
    const sale = db2.prepare("SELECT * FROM sales WHERE invoice_no = ?").get(invoiceNo);
    if (!sale) throw new Error("Invoice not found");
    const items = db2.prepare(`
      SELECT si.*, m.name as medicine_name, b.batch_no,
      (si.qty - COALESCE((SELECT SUM(ri.qty) FROM return_items ri WHERE ri.sale_item_id = si.id), 0)) as returnable_qty
      FROM sale_items si
      JOIN medicines m ON m.id = si.medicine_id
      JOIN batches b ON b.id = si.batch_id
      WHERE si.sale_id = ?
    `).all(sale.id);
    return { sale, items };
  },
  processReturn(saleId, items, userId, reason) {
    const db2 = getDb();
    const tx = db2.transaction(() => {
      const totalRefund = items.reduce((sum, item) => sum + item.refund_amount, 0);
      const res = db2.prepare(
        "INSERT INTO returns (sale_id, user_id, total_refund, reason) VALUES (?, ?, ?, ?)"
      ).run(saleId, userId, totalRefund, reason);
      const returnId = Number(res.lastInsertRowid);
      for (const item of items) {
        if (item.qty <= 0) continue;
        db2.prepare(`
          INSERT INTO return_items (return_id, sale_item_id, medicine_id, batch_id, qty, refund_amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(returnId, item.sale_item_id, item.medicine_id, item.batch_id, item.qty, item.refund_amount);
        db2.prepare("UPDATE batches SET qty = qty + ? WHERE id = ?").run(item.qty, item.batch_id);
      }
      db2.prepare(`INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, 'SALE_RETURN', 'return', ?, ?)`).run(userId, returnId, JSON.stringify({ totalRefund, reason }));
      return { returnId, totalRefund };
    });
    return tx();
  },
  // THIS WAS MISSING
  getHistory() {
    return getDb().prepare(`
      SELECT r.*, s.invoice_no, u.full_name as processed_by 
      FROM returns r 
      JOIN sales s ON s.id = r.sale_id 
      JOIN users u ON u.id = r.user_id 
      ORDER BY r.id DESC LIMIT 50
    `).all();
  }
};
const doctorService = {
  list() {
    return getDb().prepare("SELECT * FROM doctors ORDER BY name ASC").all();
  },
  create(input) {
    return getDb().prepare(
      "INSERT INTO doctors (name, pmdc_no, hospital, phone, specialty, email, notes) VALUES (@name, @pmdc_no, @hospital, @phone, @specialty, @email, @notes)"
    ).run(input);
  },
  update(id, input) {
    return getDb().prepare(
      "UPDATE doctors SET name=@name, pmdc_no=@pmdc_no, hospital=@hospital, phone=@phone, specialty=@specialty, email=@email, notes=@notes WHERE id=@id"
    ).run({ ...input, id });
  },
  delete(id) {
    return getDb().prepare("DELETE FROM doctors WHERE id = ?").run(id);
  },
  getPrescriptions() {
    return getDb().prepare(`
      SELECT cr.*, m.name as medicine_name, d.name as doctor_name, d.pmdc_no, s.invoice_no, s.created_at
      FROM controlled_register cr
      JOIN medicines m ON m.id = cr.medicine_id
      LEFT JOIN doctors d ON d.id = cr.doctor_id
      JOIN sales s ON s.id = cr.sale_id
      ORDER BY cr.id DESC
    `).all();
  }
};
const customerService = {
  list() {
    return getDb().prepare("SELECT * FROM customers ORDER BY name ASC").all();
  },
  create(input) {
    return getDb().prepare(
      "INSERT INTO customers (name, phone, cnic, email, address, notes) VALUES (@name, @phone, @cnic, @email, @address, @notes)"
    ).run(input);
  },
  update(id, input) {
    return getDb().prepare(
      "UPDATE customers SET name=@name, phone=@phone, cnic=@cnic, email=@email, address=@address, notes=@notes WHERE id=@id"
    ).run({ ...input, id });
  },
  delete(id) {
    return getDb().prepare("DELETE FROM customers WHERE id = ?").run(id);
  },
  // NEW: Khata Ledger Logic
  getLedger(customerId) {
    const db2 = getDb();
    const sales = db2.prepare(`
      SELECT id, invoice_no, total as amount, created_at, 'Credit Sale' as type 
      FROM sales WHERE customer_id = ? AND payment_status = 'Credit'
    `).all(customerId);
    const payments = db2.prepare(`
      SELECT id, 'Payment' as invoice_no, amount, created_at, 'Payment Received' as type, notes
      FROM customer_payments WHERE customer_id = ?
    `).all(customerId);
    const history = [...sales, ...payments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const totalCredit = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalCredit - totalPaid;
    return { history, totalCredit, totalPaid, balance };
  },
  addPayment(customerId, amount, notes, date) {
    return getDb().prepare(
      "INSERT INTO customer_payments (customer_id, amount, notes, date) VALUES (?, ?, ?, ?)"
    ).run(customerId, amount, notes, date);
  }
};
const auditService = {
  getLogs() {
    return getDb().prepare(`
      SELECT a.*, u.full_name, u.username 
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.id DESC LIMIT 200
    `).all();
  }
};
const supplierService = {
  list() {
    return getDb().prepare("SELECT * FROM suppliers ORDER BY name").all();
  },
  create(input) {
    return getDb().prepare("INSERT INTO suppliers (name, license_no, phone, address) VALUES (@name, @license_no, @phone, @address)").run(input);
  },
  delete(id) {
    try {
      getDb().prepare("DELETE FROM suppliers WHERE id = ?").run(id);
    } catch (err) {
      if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        throw new Error("Cannot delete supplier because they have purchase history.");
      }
      throw err;
    }
  },
  getLedger(supplierId) {
    const db2 = getDb();
    const purchases = db2.prepare(`SELECT id, invoice_no, total_amount as amount, paid_amount, created_at, 'Purchase Bill' as type FROM purchases WHERE supplier_id = ?`).all(supplierId);
    const payments = db2.prepare(`SELECT id, 'Payment' as invoice_no, amount, 0 as paid_amount, created_at, 'Payment Paid' as type, notes FROM supplier_payments WHERE supplier_id = ?`).all(supplierId);
    const history = [...purchases, ...payments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const totalPurchased = purchases.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = purchases.reduce((sum, p) => sum + p.paid_amount, 0) + payments.reduce((sum, p) => sum + p.amount, 0);
    return { history, totalPurchased, totalPaid, balance: totalPurchased - totalPaid };
  },
  addPayment(supplierId, amount, notes) {
    return getDb().prepare("INSERT INTO supplier_payments (supplier_id, amount, notes) VALUES (?, ?, ?)").run(supplierId, amount, notes);
  }
};
const systemService = {
  healDatabase() {
    const db2 = getDb();
    const fixes = [];
    try {
      const negativeStock = db2.prepare("SELECT COUNT(*) as count FROM batches WHERE qty < 0").get();
      if (negativeStock.count > 0) {
        db2.prepare("UPDATE batches SET qty = 0 WHERE qty < 0").run();
        fixes.push(`Fixed ${negativeStock.count} batch(es) with negative stock.`);
      }
      const orphanedSales = db2.prepare("SELECT COUNT(*) as count FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales)").get();
      if (orphanedSales.count > 0) {
        db2.prepare("DELETE FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales)").run();
        fixes.push(`Cleaned ${orphanedSales.count} orphaned sale items.`);
      }
      const integrity = db2.pragma("integrity_check");
      if (integrity[0]?.integrity_check !== "ok") {
        fixes.push(`Database integrity warning: ${integrity[0]?.integrity_check}`);
      }
      db2.pragma("optimize");
      db2.exec("VACUUM");
      if (fixes.length === 0) {
        return ["Database is perfectly healthy. No issues found."];
      }
      return fixes;
    } catch (err) {
      throw new Error(`Self-Heal failed: ${err.message}`);
    }
  }
};
function runAutoBackup() {
  try {
    const dbPath = path.join(electron.app.getPath("userData"), "nms.db");
    const backupDir = path.join(electron.app.getPath("documents"), "NMS_Backups");
    fs.mkdirSync(backupDir, { recursive: true });
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().replace(/:/g, "-").slice(0, 16);
    const backupPath = path.join(backupDir, `nms_backup_${dateStr}.db`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`[backup] Auto-backup successful to ${backupPath}`);
  } catch (error) {
    console.error("[backup] Auto-backup Failed:", error);
  }
}
async function manualBackup() {
  const dbPath = path.join(electron.app.getPath("userData"), "nms.db");
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const { filePath } = await electron.dialog.showSaveDialog({
    title: "Save Database Backup",
    defaultPath: `nms_backup_${dateStr}.db`,
    filters: [{ name: "SQLite Database", extensions: ["db"] }]
  });
  if (filePath) {
    fs.copyFileSync(dbPath, filePath);
    return true;
  }
  return false;
}
function registerIpc() {
  electron.ipcMain.handle("auth:login", (_e, u, p) => authService.login(u, p));
  electron.ipcMain.handle("medicine:search", (_e, q) => medicineService.search(q));
  electron.ipcMain.handle("medicine:list", () => medicineService.listAll());
  electron.ipcMain.handle("medicine:create", (_e, i, uid) => medicineService.create(i, uid));
  electron.ipcMain.handle("medicine:update", (_e, id, i, uid) => medicineService.update(id, i, uid));
  electron.ipcMain.handle("medicine:delete", (_e, id, uid) => medicineService.delete(id, uid));
  electron.ipcMain.handle("medicine:batches", (_e, id) => medicineService.getBatches(id));
  electron.ipcMain.handle("sales:create", (_e, i, uid) => salesService.create(i, uid));
  electron.ipcMain.handle("sales:history", () => salesService.getHistory());
  electron.ipcMain.handle("sales:details", (_e, id) => salesService.getSaleDetails(id));
  electron.ipcMain.handle("sales:delete", (_e, id, uid) => salesService.deleteSale(id, uid));
  electron.ipcMain.handle("inventory:addStock", (_e, i, uid) => inventoryService.addStock(i));
  electron.ipcMain.handle("inventory:purchases", () => inventoryService.getPurchaseHistory());
  electron.ipcMain.handle("inventory:updateBatch", (_e, id, i) => inventoryService.updateBatch(id, i));
  electron.ipcMain.handle("inventory:deleteBatch", (_e, id) => inventoryService.deleteBatch(id));
  electron.ipcMain.handle("inventory:adjust", (_e, bId, qty, type, notes, uid) => inventoryService.adjustStock(bId, qty, type, notes, uid));
  electron.ipcMain.handle("inventory:lowStock", () => inventoryService.getLowStock());
  electron.ipcMain.handle("inventory:expiring", () => inventoryService.getExpiring());
  electron.ipcMain.handle("inventory:returnHistory", () => inventoryService.getReturnHistory());
  electron.ipcMain.handle("dashboard:stats", () => dashboardService.stats());
  electron.ipcMain.handle("dashboard:alerts", () => dashboardService.getAlerts());
  electron.ipcMain.handle("user:list", () => userService.list());
  electron.ipcMain.handle("user:create", (_e, i) => userService.create(i));
  electron.ipcMain.handle("user:update", (_e, id, i) => userService.update(id, i));
  electron.ipcMain.handle("user:toggle", (_e, id, a) => userService.toggleActive(id, a));
  electron.ipcMain.handle("user:delete", (_e, id) => userService.delete(id));
  electron.ipcMain.handle("print:receipt", (_e, html) => printReceipt(html));
  electron.ipcMain.handle("print:a4", (_e, html) => printA4(html));
  electron.ipcMain.handle("settings:get", () => settingsService.getAll());
  electron.ipcMain.handle("settings:update", (_e, k, v) => settingsService.update(k, v));
  electron.ipcMain.handle("system:backup", () => manualBackup());
  electron.ipcMain.handle("system:heal", () => systemService.healDatabase());
  electron.ipcMain.handle("customer:list", () => customerService.list());
  electron.ipcMain.handle("customer:create", (_e, c) => customerService.create(c));
  electron.ipcMain.handle("customer:update", (_e, id, c) => customerService.update(id, c));
  electron.ipcMain.handle("customer:delete", (_e, id) => customerService.delete(id));
  electron.ipcMain.handle("customer:ledger", (_e, id) => customerService.getLedger(id));
  electron.ipcMain.handle("customer:pay", (_e, id, amount, notes, date) => customerService.addPayment(id, amount, notes, date));
  electron.ipcMain.handle("supplier:list", () => supplierService.list());
  electron.ipcMain.handle("supplier:create", (_e, i) => supplierService.create(i));
  electron.ipcMain.handle("supplier:delete", (_e, id) => supplierService.delete(id));
  electron.ipcMain.handle("supplier:ledger", (_e, id) => supplierService.getLedger(id));
  electron.ipcMain.handle("supplier:pay", (_e, id, amount, notes) => supplierService.addPayment(id, amount, notes));
  electron.ipcMain.handle("expense:list", () => getDb().prepare("SELECT * FROM expenses ORDER BY id DESC").all());
  electron.ipcMain.handle("expense:create", (_e, e) => getDb().prepare("INSERT INTO expenses (category, amount, description, date) VALUES (?, ?, ?, ?)").run(e.category, e.amount, e.description, e.date));
  electron.ipcMain.handle("report:sales", (_e, s, e) => reportService.getSalesReport(s, e));
  electron.ipcMain.handle("report:profit", (_e, s, e) => reportService.getProfitReport(s, e));
  electron.ipcMain.handle("report:pnl", (_e, s, e) => reportService.getProfitAndLoss(s, e));
  electron.ipcMain.handle("return:getSale", (_e, inv) => returnsService.getSaleForReturn(inv));
  electron.ipcMain.handle("return:process", (_e, saleId, items, uid, reason) => returnsService.processReturn(saleId, items, uid, reason));
  electron.ipcMain.handle("return:history", () => returnsService.getHistory());
  electron.ipcMain.handle("doctor:list", () => doctorService.list());
  electron.ipcMain.handle("doctor:create", (_e, i) => doctorService.create(i));
  electron.ipcMain.handle("doctor:update", (_e, id, i) => doctorService.update(id, i));
  electron.ipcMain.handle("doctor:delete", (_e, id) => doctorService.delete(id));
  electron.ipcMain.handle("doctor:prescriptions", () => doctorService.getPrescriptions());
  electron.ipcMain.handle("audit:logs", () => auditService.getLogs());
}
log.initialize();
electron.app.whenReady().then(() => {
  electronApp.setAppUserModelId("pk.nationalmedicalstore.app");
  initDatabase();
  runMigrations();
  runSeed();
  registerIpc();
  createWindow();
  electron.app.on("browser-window-created", (_, w) => optimizer.watchWindowShortcuts(w));
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("before-quit", () => {
  runAutoBackup();
});
