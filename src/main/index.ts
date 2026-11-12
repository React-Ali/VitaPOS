import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from './window'
import { initDatabase } from './database/connection'
import { runMigrations } from './database/migrate'
import { runSeed } from './database/seed'
import { registerIpc } from './ipc' // <--- Make sure this is imported
import { runAutoBackup } from './services/backup.service'
import log from 'electron-log/main'

log.initialize()

app.whenReady().then(() => {
  electronApp.setAppUserModelId('pk.nationalmedicalstore.app')

  initDatabase()
  runMigrations()
  runSeed()

  registerIpc() // <--- Make sure this is called BEFORE createWindow
  createWindow()

  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  runAutoBackup()
})