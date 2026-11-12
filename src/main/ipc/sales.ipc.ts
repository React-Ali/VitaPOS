import { ipcMain } from 'electron'
import { salesService } from '../services/sales.service'

export function registerSalesIpc(): void {
  ipcMain.handle('sales:create', (_e, input, userId: number) => salesService.create(input, userId))
  ipcMain.handle('sales:getById', (_e, id: number) => salesService.getById(id))
}