import { app, dialog } from 'electron'
import { join } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

// Background Auto-Backup (Runs on app close)
export function runAutoBackup() {
  try {
    const dbPath = join(app.getPath('userData'), 'nms.db')
    const backupDir = join(app.getPath('documents'), 'NMS_Backups')
    mkdirSync(backupDir, { recursive: true })
    
    const dateStr = new Date().toISOString().replace(/:/g, '-').slice(0, 16)
    const backupPath = join(backupDir, `nms_backup_${dateStr}.db`)
    
    copyFileSync(dbPath, backupPath)
    console.log(`[backup] Auto-backup successful to ${backupPath}`)
  } catch (error) {
    console.error('[backup] Auto-backup Failed:', error)
  }
}

// Manual Backup (Triggers Save Dialog for USB/Downloads)
export async function manualBackup() {
  const dbPath = join(app.getPath('userData'), 'nms.db')
  const dateStr = new Date().toISOString().slice(0, 10)
  
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Database Backup',
    defaultPath: `nms_backup_${dateStr}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })

  if (filePath) {
    copyFileSync(dbPath, filePath)
    return true
  }
  return false
}