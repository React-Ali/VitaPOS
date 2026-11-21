import { ipcMain, app } from 'electron'
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
import { configService } from '../config'
import { callMasterServer } from '../services/network.service'

export function registerIpc(): void {
  const handle = (channel: string, localFunction: (...args: any[]) => any) => {
    ipcMain.handle(channel, async (_e, ...args) => {
      const config = configService.get()
      if (config.mode === 'client') {
        return await callMasterServer(channel, args)
      }
      return localFunction(...args)
    })
  }

  // Auth
  handle('auth:login', (u, p) => authService.login(u, p))
  handle('auth:reset', (u, p, key) => authService.resetPassword(u, p, key))
  handle('auth:generateCode', (username) => authService.generateRecoveryCode(username))
  
  // Medicines
  handle('medicine:search', (q) => medicineService.search(q))
  handle('medicine:list', () => medicineService.listAll())
  handle('medicine:create', (i, uid) => medicineService.create(i, uid))
  handle('medicine:update', (id, i, uid) => medicineService.update(id, i, uid))
  handle('medicine:delete', (id, uid) => medicineService.delete(id, uid))
  handle('medicine:batches', (id) => medicineService.getBatches(id))
  handle('medicine:barcode', (code) => medicineService.getByBarcode(code))
  
  // Sales
  handle('sales:create', (i, uid) => salesService.create(i, uid))
  handle('sales:history', () => salesService.getHistory())
  handle('sales:details', (id) => salesService.getSaleDetails(id))
  handle('sales:delete', (id, uid) => salesService.deleteSale(id, uid))
  
  // Inventory & Purchases
  handle('inventory:addStock', (i, uid) => inventoryService.addStock(i, uid))
  handle('inventory:purchases', () => inventoryService.getPurchaseHistory())
  handle('inventory:updateBatch', (id, i) => inventoryService.updateBatch(id, i))
  handle('inventory:deleteBatch', (id) => inventoryService.deleteBatch(id))
  handle('inventory:adjust', (bId, qty, type, notes, uid) => inventoryService.adjustStock(bId, qty, type, notes, uid))
  handle('inventory:lowStock', () => inventoryService.getLowStock())
  handle('inventory:expiring', () => inventoryService.getExpiring())
  handle('inventory:returnHistory', () => inventoryService.getReturnHistory())
  
  // Dashboard
  handle('dashboard:stats', () => dashboardService.stats())
  handle('dashboard:alerts', () => dashboardService.getAlerts())
  
  // Users
  handle('user:list', () => userService.list())
  handle('user:create', (i) => userService.create(i))
  handle('user:update', (id, i) => userService.update(id, i))
  handle('user:toggle', (id, a) => userService.toggleActive(id, a))
  handle('user:delete', (id) => userService.delete(id))
  
  // Printing
  ipcMain.handle('print:receipt', (_e, html) => printReceipt(html))
  ipcMain.handle('print:a4', (_e, html) => printA4(html))
  
  // Settings & System
  handle('settings:get', () => settingsService.getAll())
  handle('settings:update', (k, v) => settingsService.update(k, v))
  ipcMain.handle('system:backup', () => manualBackup())
  ipcMain.handle('system:heal', () => systemService.healDatabase())

  // Customers
  handle('customer:list', () => customerService.list())
  handle('customer:create', (c) => customerService.create(c))
  handle('customer:update', (id, c) => customerService.update(id, c))
  handle('customer:delete', (id) => customerService.delete(id))
  handle('customer:ledger', (id) => customerService.getLedger(id))
  handle('customer:pay', (id, amount, notes, date) => customerService.addPayment(id, amount, notes, date))
  
  // Suppliers
  handle('supplier:list', () => supplierService.list())
  handle('supplier:create', (i) => supplierService.create(i))
  handle('supplier:delete', (id) => supplierService.delete(id))
  handle('supplier:ledger', (id) => supplierService.getLedger(id))
  handle('supplier:pay', (id, amount, notes) => supplierService.addPayment(id, amount, notes))
  
  // Expenses
  handle('expense:list', () => getDb().prepare('SELECT * FROM expenses ORDER BY id DESC').all())
  handle('expense:create', (e) => getDb().prepare('INSERT INTO expenses (category, amount, description, date) VALUES (?, ?, ?, ?)').run(e.category, e.amount, e.description, e.date))
  
  // Reports
  handle('report:sales', (s, e) => reportService.getSalesReport(s, e))
  handle('report:profit', (s, e) => reportService.getProfitReport(s, e))
  handle('report:pnl', (s, e) => reportService.getProfitAndLoss(s, e))
  
  // Returns
  handle('return:getSale', (inv) => returnsService.getSaleForReturn(inv))
  handle('return:process', (saleId, items, uid, reason) => returnsService.processReturn(saleId, items, uid, reason))
  handle('return:history', () => returnsService.getHistory())

  // Doctors
  handle('doctor:list', () => doctorService.list())
  handle('doctor:create', (i) => doctorService.create(i))
  handle('doctor:update', (id, i) => doctorService.update(id, i))
  handle('doctor:delete', (id) => doctorService.delete(id))
  handle('doctor:prescriptions', () => doctorService.getPrescriptions())

  // Audit
  handle('audit:logs', () => auditService.getLogs())

  // Network
  ipcMain.handle('network:get', () => configService.get())
  ipcMain.handle('network:set', (_e, config) => configService.set(config))
  ipcMain.handle('network:test', async () => {
    try {
      if (configService.get().mode === 'client') {
        await callMasterServer('dashboard:stats', [])
      }
      return { success: true, message: 'Connected to Master PC successfully!' }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  })

  // App Control
  ipcMain.handle('app:relaunch', () => {
    app.relaunch()
    app.exit(0)
  })
}