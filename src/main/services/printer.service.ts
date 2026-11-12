import { BrowserWindow, app } from 'electron'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

function createPrintWindow(htmlContent: string, isA4: boolean) {
  const tempFile = join(app.getPath('temp'), `print_${Date.now()}.html`)
  writeFileSync(tempFile, htmlContent, 'utf8')

  const win = new BrowserWindow({ 
    width: isA4 ? 1000 : 400, 
    height: 800, 
    show: false,
    autoHideMenuBar: true,
    webPreferences: { offscreen: true } // Renders faster
  })
  
  win.loadFile(tempFile)

  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      win.webContents.print({
        silent: false, // Shows the Windows dialog so you can pick the printer
        printBackground: true,
        // 80mm width = 80,000 microns. Height 297mm = 297,000 microns
        pageSize: isA4 ? 'A4' : { width: 80000, height: 297000 },
        margins: { marginType: 'none' },
        scaleFactor: 100
      }, (success, failureReason) => {
        if (!success) console.log('Print failed:', failureReason)
        win.close()
        try { unlinkSync(tempFile) } catch (e) {}
      })
    }, 500) // Wait 500ms to ensure fonts and layout are fully rendered
  })
}

export function printReceipt(htmlContent: string) { createPrintWindow(htmlContent, false) }
export function printA4(htmlContent: string) { createPrintWindow(htmlContent, true) }