import express from 'express'
import cors from 'cors'
import { getDb } from './database/connection'
import { medicineService } from './services/medicine.service'
import { salesService } from './services/sales.service'
import { inventoryService } from './services/inventory.service'
import { dashboardService } from './services/dashboard.service'
import { customerService } from './services/customer.service'
import { supplierService } from './services/supplier.service'
import { reportService } from './services/report.service'
import { doctorService } from './services/doctor.service'
import { settingsService } from './services/settings.service'
import { authService } from './services/auth.service'
import { userService } from './services/user.service'
import { returnsService } from './services/returns.service'
import { auditService } from './services/audit.service'

export function startMasterServer() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  // GENERIC RPC ENDPOINT
  app.post('/rpc', async (req, res) => {
    const { channel, args } = req.body
    try {
      let result
      switch (channel) {
        // Auth
        case 'auth:login': result = authService.login(args[0], args[1]); break;
        case 'auth:reset': result = authService.resetPassword(args[0], args[1], args[2]); break;
        case 'auth:generateCode': result = authService.generateRecoveryCode(args[0]); break;
        
        // Medicines
        case 'medicine:list': result = medicineService.listAll(); break;
        case 'medicine:search': result = medicineService.search(args[0]); break;
        case 'medicine:batches': result = medicineService.getBatches(args[0]); break;
        case 'medicine:create': result = medicineService.create(args[0], args[1]); break;
        case 'medicine:update': result = medicineService.update(args[0], args[1], args[2]); break;
        case 'medicine:delete': result = medicineService.delete(args[0], args[1]); break;
        case 'medicine:barcode': result = medicineService.getByBarcode(args[0]); break;
        
        // Sales
        case 'sales:create': result = salesService.create(args[0], args[1]); break;
        case 'sales:history': result = salesService.getHistory(); break;
        case 'sales:details': result = salesService.getSaleDetails(args[0]); break;
        case 'sales:delete': result = salesService.deleteSale(args[0], args[1]); break;
        
        // Inventory
        case 'inventory:addStock': result = inventoryService.addStock(args[0], args[1]); break;
        case 'inventory:purchases': result = inventoryService.getPurchaseHistory(); break;
        case 'inventory:updateBatch': result = inventoryService.updateBatch(args[0], args[1]); break;
        case 'inventory:deleteBatch': result = inventoryService.deleteBatch(args[0]); break;
        case 'inventory:adjust': result = inventoryService.adjustStock(args[0], args[1], args[2], args[3], args[4]); break;
        case 'inventory:lowStock': result = inventoryService.getLowStock(); break;
        case 'inventory:expiring': result = inventoryService.getExpiring(); break;
        case 'inventory:returnHistory': result = inventoryService.getReturnHistory(); break;
        
        // Users (This was missing!)
        case 'user:list': result = userService.list(); break;
        case 'user:create': result = userService.create(args[0]); break;
        case 'user:update': result = userService.update(args[0], args[1]); break;
        case 'user:toggle': result = userService.toggleActive(args[0], args[1]); break;
        case 'user:delete': result = userService.delete(args[0]); break;
        
        // Customers
        case 'customer:list': result = customerService.list(); break;
        case 'customer:create': result = customerService.create(args[0]); break;
        case 'customer:update': result = customerService.update(args[0], args[1]); break;
        case 'customer:delete': result = customerService.delete(args[0]); break;
        case 'customer:ledger': result = customerService.getLedger(args[0]); break;
        case 'customer:pay': result = customerService.addPayment(args[0], args[1], args[2], args[3]); break;
        
        // Suppliers
        case 'supplier:list': result = supplierService.list(); break;
        case 'supplier:create': result = supplierService.create(args[0]); break;
        case 'supplier:delete': result = supplierService.delete(args[0]); break;
        case 'supplier:ledger': result = supplierService.getLedger(args[0]); break;
        case 'supplier:pay': result = supplierService.addPayment(args[0], args[1], args[2]); break;
        
        // Expenses
        case 'expense:list': result = getDb().prepare('SELECT * FROM expenses ORDER BY id DESC').all(); break;
        case 'expense:create': result = getDb().prepare('INSERT INTO expenses (category, amount, description, date) VALUES (?, ?, ?, ?)').run(args[0].category, args[0].amount, args[0].description, args[0].date); break;
        
        // Reports (This was missing!)
        case 'report:sales': result = reportService.getSalesReport(args[0], args[1]); break;
        case 'report:profit': result = reportService.getProfitReport(args[0], args[1]); break;
        case 'report:pnl': result = reportService.getProfitAndLoss(args[0], args[1]); break;
        
        // Returns
        case 'return:getSale': result = returnsService.getSaleForReturn(args[0]); break;
        case 'return:process': result = returnsService.processReturn(args[0], args[1], args[2], args[3]); break;
        case 'return:history': result = returnsService.getHistory(); break;
        
        // Doctors
        case 'doctor:list': result = doctorService.list(); break;
        case 'doctor:create': result = doctorService.create(args[0]); break;
        case 'doctor:update': result = doctorService.update(args[0], args[1]); break;
        case 'doctor:delete': result = doctorService.delete(args[0]); break;
        case 'doctor:prescriptions': result = doctorService.getPrescriptions(); break;
        
        // Audit & Dashboard
        case 'audit:logs': result = auditService.getLogs(); break;
        case 'dashboard:stats': result = dashboardService.stats(); break;
        case 'dashboard:alerts': result = dashboardService.getAlerts(); break;
        
        // Settings
        case 'settings:get': result = settingsService.getAll(); break;
        case 'settings:update': result = settingsService.update(args[0], args[1]); break;
        
        default: throw new Error(`Channel ${channel} not implemented on Master Server`)
      }
      res.json({ success: true, data: result })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  })

  app.listen(3001, '0.0.0.0', () => {
    console.log('Master Server running on port 3001')
  })
}