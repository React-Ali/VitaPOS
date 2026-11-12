import { ipcMain } from 'electron'
import { medicineService } from '../services/medicine.service'

export function registerMedicineIpc(): void {
  ipcMain.handle('medicine:search', (_e, q: string) => medicineService.search(q))
  ipcMain.handle('medicine:list', () => medicineService.listAll())
  ipcMain.handle('medicine:create', (_e, input, userId: number) => medicineService.create(input, userId))
  ipcMain.handle('medicine:batches', (_e, id: number) => medicineService.getBatches(id))
}