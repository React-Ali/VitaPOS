import { getDb } from '../database/connection'

export const systemService = {
  healDatabase() {
    const db = getDb()
    const fixes: string[] = []

    try {
      // 1. Fix negative stock
      const negativeStock = db.prepare('SELECT COUNT(*) as count FROM batches WHERE qty < 0').get() as any
      if (negativeStock.count > 0) {
        db.prepare('UPDATE batches SET qty = 0 WHERE qty < 0').run()
        fixes.push(`Fixed ${negativeStock.count} batch(es) with negative stock.`)
      }

      // 2. Clean orphaned sale items
      const orphanedSales = db.prepare('SELECT COUNT(*) as count FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales)').get() as any
      if (orphanedSales.count > 0) {
        db.prepare('DELETE FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales)').run()
        fixes.push(`Cleaned ${orphanedSales.count} orphaned sale items.`)
      }

      // 3. Check integrity
      const integrity = db.pragma('integrity_check') as any[]
      if (integrity[0]?.integrity_check !== 'ok') {
        fixes.push(`Database integrity warning: ${integrity[0]?.integrity_check}`)
      }

      // 4. Optimize and Vacuum
      db.pragma('optimize')
      db.exec('VACUUM')

      if (fixes.length === 0) {
        return ['Database is perfectly healthy. No issues found.']
      }
      return fixes
    } catch (err: any) {
      throw new Error(`Self-Heal failed: ${err.message}`)
    }
  }
}