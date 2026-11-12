import { ipcMain } from 'electron'
import { inventoryService } from '../services/inventory.service'

export function registerInventoryIpc(): void {
  ipcMain.handle('inventory:addStock', (_e, input, userId: number) => inventoryService.addStock(input, userId))
  ipcMain.handle('inventory:lowStock', () => inventoryService.lowStock())
  ipcMain.handle('inventory:expiring', () => inventoryService.expiring())
}