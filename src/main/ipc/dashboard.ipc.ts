import { ipcMain } from 'electron'
import { dashboardService } from '../services/dashboard.service'

export function registerDashboardIpc(): void {
  ipcMain.handle('dashboard:stats', () => dashboardService.stats())
}