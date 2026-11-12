import { ipcMain } from 'electron'
import { authService } from '../services/auth.service'
import { medicineService } from '../services/medicine.service'
import { salesService } from '../services/sales.service'
import { inventoryService } from '../services/inventory.service'
import { dashboardService } from '../services/dashboard.service'
import { userService } from '../services/user.service'
import { settingsService } from '../services/settings.service'
import { printReceipt, printA4 } from '../services/printer.service'
import { reportService } from '../services/report.service'
import { returnsService } from '../services/returns.service'
import { doctorService } from '../services/doctor.service'
import { customerService } from '../services/customer.service'
import { auditService } from '../services/audit.service'
import { supplierService } from '../services/supplier.service'
import { systemService } from '../services/system.service'
import { runAutoBackup, manualBackup } from '../services/backup.service'
import { getDb } from '../database/connection'

export function registerIpc(): void {
  // Auth
  ipcMain.handle('auth:login', (_e, u, p) => authService.login(u, p))
  
  // Medicines
  ipcMain.handle('medicine:search', (_e, q) => medicineService.search(q))
  ipcMain.handle('medicine:list', () => medicineService.listAll())
  ipcMain.handle('medicine:create', (_e, i, uid) => medicineService.create(i, uid))
  ipcMain.handle('medicine:update', (_e, id, i, uid) => medicineService.update(id, i, uid))
  ipcMain.handle('medicine:delete', (_e, id, uid) => medicineService.delete(id, uid))
  ipcMain.handle('medicine:batches', (_e, id) => medicineService.getBatches(id))
  
  // Sales
  ipcMain.handle('sales:create', (_e, i, uid) => salesService.create(i, uid))
  ipcMain.handle('sales:history', () => salesService.getHistory())
  ipcMain.handle('sales:details', (_e, id) => salesService.getSaleDetails(id))
  ipcMain.handle('sales:delete', (_e, id, uid) => salesService.deleteSale(id, uid))
  
  // Inventory & Purchases
  ipcMain.handle('inventory:addStock', (_e, i, uid) => inventoryService.addStock(i, uid))
  ipcMain.handle('inventory:purchases', () => inventoryService.getPurchaseHistory())
  ipcMain.handle('inventory:updateBatch', (_e, id, i) => inventoryService.updateBatch(id, i))
  ipcMain.handle('inventory:deleteBatch', (_e, id) => inventoryService.deleteBatch(id))
  ipcMain.handle('inventory:adjust', (_e, bId, qty, type, notes, uid) => inventoryService.adjustStock(bId, qty, type, notes, uid))
  ipcMain.handle('inventory:lowStock', () => inventoryService.getLowStock())
  ipcMain.handle('inventory:expiring', () => inventoryService.getExpiring())
  ipcMain.handle('inventory:returnHistory', () => inventoryService.getReturnHistory())
  
  // Dashboard
  ipcMain.handle('dashboard:stats', () => dashboardService.stats())
  ipcMain.handle('dashboard:alerts', () => dashboardService.getAlerts())
  
  // Users
  ipcMain.handle('user:list', () => userService.list())
  ipcMain.handle('user:create', (_e, i) => userService.create(i))
  ipcMain.handle('user:update', (_e, id, i) => userService.update(id, i))
  ipcMain.handle('user:toggle', (_e, id, a) => userService.toggleActive(id, a))
  ipcMain.handle('user:delete', (_e, id) => userService.delete(id))
  
  // Printing
  ipcMain.handle('print:receipt', (_e, html) => printReceipt(html))
  ipcMain.handle('print:a4', (_e, html) => printA4(html))
  
  // Settings
  ipcMain.handle('settings:get', () => settingsService.getAll())
  ipcMain.handle('settings:update', (_e, k, v) => settingsService.update(k, v))
  
  // System
  ipcMain.handle('system:backup', () => manualBackup())
  ipcMain.handle('system:heal', () => systemService.healDatabase())

  // Customers
  ipcMain.handle('customer:list', () => customerService.list())
  ipcMain.handle('customer:create', (_e, c) => customerService.create(c))
  ipcMain.handle('customer:update', (_e, id, c) => customerService.update(id, c))
  ipcMain.handle('customer:delete', (_e, id) => customerService.delete(id))
  ipcMain.handle('customer:ledger', (_e, id) => customerService.getLedger(id))
  ipcMain.handle('customer:pay', (_e, id, amount, notes, date) => customerService.addPayment(id, amount, notes, date))
  
  // Suppliers
  ipcMain.handle('supplier:list', () => supplierService.list())
  ipcMain.handle('supplier:create', (_e, i) => supplierService.create(i))
  ipcMain.handle('supplier:delete', (_e, id) => supplierService.delete(id))
  ipcMain.handle('supplier:ledger', (_e, id) => supplierService.getLedger(id))
  ipcMain.handle('supplier:pay', (_e, id, amount, notes) => supplierService.addPayment(id, amount, notes))
  
  // Expenses
  ipcMain.handle('expense:list', () => getDb().prepare('SELECT * FROM expenses ORDER BY id DESC').all())
  ipcMain.handle('expense:create', (_e, e) => getDb().prepare('INSERT INTO expenses (category, amount, description, date) VALUES (?, ?, ?, ?)').run(e.category, e.amount, e.description, e.date))
  
  // Reports
  ipcMain.handle('report:sales', (_e, s, e) => reportService.getSalesReport(s, e))
  ipcMain.handle('report:profit', (_e, s, e) => reportService.getProfitReport(s, e))
  ipcMain.handle('report:pnl', (_e, s, e) => reportService.getProfitAndLoss(s, e))
  
  // Returns
  ipcMain.handle('return:getSale', (_e, inv) => returnsService.getSaleForReturn(inv))
  ipcMain.handle('return:process', (_e, saleId, items, uid, reason) => returnsService.processReturn(saleId, items, uid, reason))
  ipcMain.handle('return:history', () => returnsService.getHistory())

  // Doctors
  ipcMain.handle('doctor:list', () => doctorService.list())
  ipcMain.handle('doctor:create', (_e, i) => doctorService.create(i))
  ipcMain.handle('doctor:update', (_e, id, i) => doctorService.update(id, i))
  ipcMain.handle('doctor:delete', (_e, id) => doctorService.delete(id))
  ipcMain.handle('doctor:prescriptions', () => doctorService.getPrescriptions())

  // Audit
  ipcMain.handle('audit:logs', () => auditService.getLogs())
}