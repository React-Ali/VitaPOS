import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from './window'
import { initDatabase } from './database/connection'
import { runMigrations } from './database/migrate'
import { runSeed } from './database/seed'
import { registerIpc } from './ipc'
import { runAutoBackup } from './services/backup.service'
import { startMasterServer } from './server'
import { configService } from './config'
import log from 'electron-log/main'

log.initialize()

// FORCE WINDOWS TO RECOGNIZE APP FOR NOTIFICATIONS
app.setAppUserModelId('pk.vitapos.app')

app.whenReady().then(() => {
  electronApp.setAppUserModelId('pk.vitapos.app')

  initDatabase()
  runMigrations()
  runSeed()

  const config = configService.get()
  if (config.mode === 'master') {
    startMasterServer() 
  }

  registerIpc()
  createWindow()

  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  // 1. RUN BACKUP EVERY 12 HOURS
  const TWELVE_HOURS = 12 * 60 * 60 * 1000
  setInterval(() => {
    console.log('[system] Running scheduled 12-hour backup...')
    runAutoBackup()
  }, TWELVE_HOURS)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})