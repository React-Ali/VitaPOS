import { ipcMain } from 'electron'
import { authService } from '../services/auth.service'

export function registerAuthIpc(): void {
  ipcMain.handle('auth:login', (_e, username: string, password: string) =>
    authService.login(username, password)
  )
  ipcMain.handle('auth:logout', (_e, token: string) => authService.logout(token))
  ipcMain.handle('auth:getUser', (_e, token: string) => authService.getUserByToken(token))
}