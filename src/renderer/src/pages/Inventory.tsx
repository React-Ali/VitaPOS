import { useEffect, useState } from 'react'
import { ipc } from '../lib/ipc'
import { AlertTriangle, Clock } from 'lucide-react'

export default function Inventory() {
  const [lowStock, setLowStock] = useState<any[]>([])
  const [expiring, setExpiring] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        if (window.api?.inventory?.lowStock) {
          const lowData = await ipc.inventory.lowStock()
          setLowStock(lowData || [])
        }
        if (window.api?.inventory?.expiring) {
          const expData = await ipc.inventory.expiring()
          setExpiring(expData || [])
        }
        setError('')
      } catch (err: any) {
        console.error("Inventory load error:", err)
        setError(err.message || "Failed to load inventory data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Inventory Alerts</h1>
        <p className="text-sm text-slate-500">Monitor low stock and near-expiry items.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold flex items-center gap-2">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading inventory alerts...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* LOW STOCK TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20 flex items-center justify-between">
              <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={18}/> Low Stock Alert</h3>
              <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{lowStock.length} Items</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold sticky top-0">
                  <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3 text-center">Stock</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {lowStock.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{m.name}</td>
                      <td className="px-4 py-3 text-center font-black text-red-600">{m.qty}</td>
                    </tr>
                  ))}
                  {lowStock.length === 0 && <tr><td colSpan={2} className="text-center py-8 text-slate-400">All stock levels are healthy.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* EXPIRING TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2"><Clock size={18}/> Expiring Soon (90 Days)</h3>
              <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{expiring.length} Batches</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold sticky top-0">
                  <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3 text-center">Expiry</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {expiring.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{b.medicine_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{b.batch_no}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-xs">{b.expiry_date}</span>
                      </td>
                    </tr>
                  ))}
                  {expiring.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400">No items expiring soon.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}