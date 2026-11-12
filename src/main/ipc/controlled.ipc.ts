import { ipcMain } from 'electron'
import { controlledService } from '../services/controlled.service'

export function registerControlledIpc(): void {
  ipcMain.handle('controlled:list', (_e, from?: string, to?: string) => controlledService.list(from, to))
}