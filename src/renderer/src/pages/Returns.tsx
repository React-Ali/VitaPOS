import { useState, useEffect } from 'react'
import { ipc, fmtPKR, formatDateTime } from '../lib/ipc'
import { downloadCSV } from '../lib/export'
import { useAuth } from '../store/auth.store'
import { Search, RotateCcw, History, Trash2, FileDown, AlertTriangle, ListFilter } from 'lucide-react'

export default function Returns() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier' | 'history'>('customer')
  
  // Customer Return State
  const [invoiceQuery, setInvoiceQuery] = useState('')
  const [data, setData] = useState<any>(null)
  const [customerHistory, setCustomerHistory] = useState<any[]>([])
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({})
  const [reason, setReason] = useState('Customer changed mind')
  const [error, setError] = useState('')
  
  // Supplier/Expired Return State
  const [medicines, setMedicines] = useState<any[]>([])
  const [selectedMed, setSelectedMed] = useState<any>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [adjForm, setAdjForm] = useState({ batchId: 0, qty: 0, type: 'expired', notes: '' })
  const [adjError, setAdjError] = useState('')

  // Return History State (Supplier)
  const [supplierHistory, setSupplierHistory] = useState<any[]>([])

  const loadAllHistory = async () => {
    try {
      setCustomerHistory(await ipc.return.history())
      setSupplierHistory(await ipc.inventory.returnHistory())
    } catch (err) { console.error(err) }
  }

  const loadMeds = () => ipc.medicine.list().then(setMedicines).catch(console.error)

  useEffect(() => { loadAllHistory(); loadMeds() }, [])

  const exportHistory = () => {
    const headers = ['Date', 'Invoice No', 'Processed By', 'Reason', 'Refund Amount']
    const rows = customerHistory.map(h => [formatDateTime(h.created_at), h.invoice_no, h.processed_by, h.reason, h.total_refund.toFixed(2)])
    downloadCSV('Returns_Refund_History.csv', headers, rows)
  }

  const searchInvoice = async () => {
    if (!invoiceQuery.trim()) return
    setError('')
    try {
      const res = await ipc.return.getSale(invoiceQuery)
      setData(res); setReturnQtys({}) 
    } catch (err: any) { setError(err.message); setData(null) }
  }

  const handleQtyChange = (id: number, qty: number, max: number) => setReturnQtys({ ...returnQtys, [id]: Math.max(0, Math.min(qty, max)) })

  const submitCustomerReturn = async () => {
    const items = data.items.filter((i: any) => (returnQtys[i.id] || 0) > 0).map((i: any) => ({
      sale_item_id: i.id, medicine_id: i.medicine_id, batch_id: i.batch_id, qty: returnQtys[i.id], refund_amount: returnQtys[i.id] * i.unit_price
    }))
    if (items.length === 0) return setError('Select items to return')
    
    try {
      await ipc.return.process(data.sale.id, items, user!.id, reason)
      setData(null); setInvoiceQuery(''); loadAllHistory(); setError('')
    } catch (err: any) { setError(err.message) }
  }

  const pickMedForAdj = async (mId: number) => {
    const m = medicines.find(x => x.id === mId)
    setSelectedMed(m || null)
    if (m) setBatches(await ipc.medicine.batches(mId))
  }

  const submitStockAdjustment = async () => {
    if (!adjForm.batchId || adjForm.qty <= 0) return setAdjError('Select a batch and valid quantity')
    setAdjError('')
    try {
      await ipc.inventory.adjust(adjForm.batchId, adjForm.qty, adjForm.type, adjForm.notes, user!.id)
      setAdjForm({ batchId: 0, qty: 0, type: 'expired', notes: '' })
      setSelectedMed(null); setBatches([]); loadMeds(); loadAllHistory()
    } catch (err: any) { setAdjError(err.message) }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Returns & Adjustments</h1>
          <p className="text-sm text-slate-500">Manage customer refunds, supplier returns, and expired stock.</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'customer' && customerHistory.length > 0 && (
            <button onClick={exportHistory} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 transition shadow-sm">
              <FileDown size={18} /> Export History
            </button>
          )}
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl">
            <button onClick={() => setActiveTab('customer')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'customer' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Customer Refunds</button>
            <button onClick={() => setActiveTab('supplier')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'supplier' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Supplier / Expired</button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Adjustment Log</button>
          </div>
        </div>
      </div>

      {/* CUSTOMER REFUNDS TAB */}
      {activeTab === 'customer' && (
        <div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 max-w-xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3 text-slate-400" size={20} />
                <input value={invoiceQuery} onChange={(e) => setInvoiceQuery(e.target.value.toUpperCase())} placeholder="Enter Invoice No..." className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <button onClick={searchInvoice} className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-900 transition">Find</button>
            </div>
            {error && <p className="text-red-500 text-xs mt-3 font-medium bg-red-50 p-2 rounded">{error}</p>}
          </div>

          {data ? (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
                    <tr><th className="px-6 py-4">Medicine</th><th className="px-6 py-4">Batch</th><th className="px-6 py-4 text-center">Return Qty</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 font-bold">{item.medicine_name}</td>
                        <td className="px-6 py-4 text-slate-500">{item.batch_no}</td>
                        <td className="px-6 py-4 text-center">
                          {item.returnable_qty > 0 ? <input type="number" min="0" max={item.returnable_qty} value={returnQtys[item.id] || ''} onChange={(e) => handleQtyChange(item.id, Number(e.target.value), item.returnable_qty)} className="w-20 border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-2 py-1 text-center font-bold outline-none" /> : <span className="text-red-400 text-xs font-bold bg-red-50 px-2 py-1 rounded">Maxed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><RotateCcw size={20} className="text-emerald-600"/> Summary</h3>
                <select value={reason} onChange={e => setReason(e.target.value)} className="w-full mb-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-2 outline-none">
                  <option>Customer changed mind</option><option>Wrong medicine</option><option>Damaged</option>
                </select>
                <button onClick={submitCustomerReturn} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition">Process Refund</button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2"><History size={18} className="text-slate-500"/><h3 className="font-bold">Recent Customer Refunds</h3></div>
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {customerHistory.map((h: any) => (
                    <tr key={h.id}>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(h.created_at)}</td>
                      <td className="px-6 py-4 font-mono">{h.invoice_no}</td>
                      <td className="px-6 py-4 text-slate-500">{h.reason}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-500">{fmtPKR(h.total_refund)}</td>
                    </tr>
                  ))}
                  {customerHistory.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No refunds recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUPPLIER / EXPIRED TAB */}
      {activeTab === 'supplier' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Trash2 size={20} className="text-red-500"/> Write-off / Supplier Return</h2>
            {adjError && <div className="bg-red-50 text-red-600 p-3 text-sm font-bold mb-4 rounded-lg flex items-center gap-2"><AlertTriangle size={16}/> {adjError}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Select Medicine</label>
                <select onChange={e => pickMedForAdj(Number(e.target.value))} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none">
                  <option value="">Search Medicine...</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {selectedMed && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Select Batch</label>
                    <select value={adjForm.batchId} onChange={e => setAdjForm({...adjForm, batchId: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none">
                      <option value={0}>Select Batch...</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.batch_no} (Exp: {b.expiry_date}) - Qty: {b.qty}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Quantity to Remove</label>
                      <input type="number" placeholder="Qty" value={adjForm.qty || ''} onChange={e => setAdjForm({...adjForm, qty: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Reason</label>
                      <select value={adjForm.type} onChange={e => setAdjForm({...adjForm, type: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 outline-none">
                        <option value="expired">Expired Stock</option>
                        <option value="supplier_return">Return to Supplier</option>
                        <option value="damaged">Damaged / Broken</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={submitStockAdjustment} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-red-700 transition">Remove Stock</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADJUSTMENT HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <ListFilter size={18} className="text-slate-500"/>
            <h3 className="font-bold">Stock Adjustment & Supplier Return Log</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Medicine</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4 text-center">Qty Removed</th>
                <th className="px-6 py-4 text-center">Reason</th>
                <th className="px-6 py-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {supplierHistory.map((h: any) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 text-slate-500">{formatDateTime(h.created_at)}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{h.medicine_name}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{h.batch_no}</td>
                  <td className="px-6 py-4 text-center font-bold text-red-500">-{h.qty}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {h.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{h.user_name}</td>
                </tr>
              ))}
              {supplierHistory.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No stock adjustments or supplier returns recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}