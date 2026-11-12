import { useEffect, useState } from 'react'
import { ipc, fmtPKR, formatDateTime } from '../lib/ipc'
import { useAuth } from '../store/auth.store'
import { Truck, PackagePlus, History, BookOpen, X, CheckCircle, AlertCircle, Trash2, AlertTriangle } from 'lucide-react'

export default function Purchases() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'stock-in' | 'history' | 'suppliers'>('stock-in')
  
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [medicines, setMedicines] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  
  const [newSupplier, setNewSupplier] = useState({ name: '', license_no: '', phone: '', address: '' })
  const [supplierError, setSupplierError] = useState('')

  const [stockIn, setStockIn] = useState({ medicineId: 0, batchNo: '', expiryDate: '', qty: 0, costPrice: 0, supplierId: 0, invoiceNo: '', paidAmount: 0 })
  const [stockError, setStockError] = useState('')

  // Supplier Ledger State
  const [ledgerSupplier, setLedgerSupplier] = useState<any | null>(null)
  const [ledgerData, setLedgerData] = useState<any>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payNotes, setPayNotes] = useState('')

  // Delete Supplier State
  const [confirmDeleteSupplier, setConfirmDeleteSupplier] = useState<any | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const load = async () => {
    try {
      setSuppliers(await ipc.supplier.list())
      setMedicines(await ipc.medicine.list())
      setPurchases(await ipc.inventory.purchases())
    } catch (err) { console.error(err) }
  }
  useEffect(() => { load() }, [])

  const addSupplier = async () => {
    if (!newSupplier.name) return setSupplierError('Supplier name required')
    setSupplierError('')
    try {
      await ipc.supplier.create(newSupplier)
      setNewSupplier({ name: '', license_no: '', phone: '', address: '' }); load()
    } catch (err: any) { setSupplierError(err.message) }
  }

  const executeDeleteSupplier = async () => {
    if (!confirmDeleteSupplier) return
    setDeleteError('')
    try {
      await ipc.supplier.delete(confirmDeleteSupplier.id)
      setConfirmDeleteSupplier(null)
      load()
    } catch (err: any) {
      setDeleteError(err.message)
    }
  }

  const handleStockIn = async () => {
    if (!stockIn.medicineId || !stockIn.batchNo || !stockIn.expiryDate || stockIn.qty <= 0) return setStockError('Fill all required fields')
    setStockError('')
    try {
      await ipc.inventory.addStock({ ...stockIn, paidAmount: Number(stockIn.paidAmount) }, user!.id)
      setStockIn({ medicineId: 0, batchNo: '', expiryDate: '', qty: 0, costPrice: 0, supplierId: 0, invoiceNo: '', paidAmount: 0 })
      load()
    } catch (e: any) { setStockError(e.message) }
  }

  const openLedger = async (sup: any) => {
    setLedgerSupplier(sup); setPayAmount(0); setPayNotes('')
    setLedgerData(await ipc.supplier.ledger(sup.id))
  }

  const submitPayment = async () => {
    if (payAmount <= 0) return
    await ipc.supplier.pay(ledgerSupplier.id, payAmount, payNotes)
    setPayAmount(0); setPayNotes('')
    setLedgerData(await ipc.supplier.ledger(ledgerSupplier.id))
    load() 
  }

  const totalCost = (stockIn.qty || 0) * (stockIn.costPrice || 0)

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Purchases & Suppliers</h1>
        <p className="text-sm text-slate-500">Record incoming inventory and manage distributor payments.</p>
      </div>

      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-fit mb-6">
        <button onClick={() => setActiveTab('stock-in')} className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${activeTab === 'stock-in' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
          <PackagePlus size={18}/> Receive Stock
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
          <History size={18}/> Purchase History
        </button>
        <button onClick={() => setActiveTab('suppliers')} className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${activeTab === 'suppliers' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
          <Truck size={18}/> Suppliers & Ledgers
        </button>
      </div>
      
      {activeTab === 'stock-in' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">Record New Purchase (Inward)</h2>
          {stockError && <div className="bg-red-50 text-red-600 p-3 text-sm font-bold mb-4 rounded-lg flex items-center gap-2"><AlertCircle size={16}/> {stockError}</div>}
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <select value={stockIn.medicineId} onChange={e => setStockIn({...stockIn, medicineId: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none">
                <option value={0}>Select Product...</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.product_type})</option>)}
              </select>
              <select value={stockIn.supplierId} onChange={e => setStockIn({...stockIn, supplierId: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none">
                <option value={0}>Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Supplier Invoice No." value={stockIn.invoiceNo} onChange={e => setStockIn({...stockIn, invoiceNo: e.target.value})} className="border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Batch Number *" value={stockIn.batchNo} onChange={e => setStockIn({...stockIn, batchNo: e.target.value})} className="border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Expiry Date</label>
                <input type="date" value={stockIn.expiryDate} onChange={e => setStockIn({...stockIn, expiryDate: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Qty Received</label>
                <input type="number" placeholder="0" value={stockIn.qty || ''} onChange={e => setStockIn({...stockIn, qty: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Cost Price/Unit</label>
                <input type="number" placeholder="0.00" value={stockIn.costPrice || ''} onChange={e => setStockIn({...stockIn, costPrice: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Bill:</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{fmtPKR(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount Paid Now:</label>
                <input type="number" placeholder={totalCost.toString()} value={stockIn.paidAmount || ''} onChange={e => setStockIn({...stockIn, paidAmount: Number(e.target.value)})} className="w-32 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 outline-none text-right font-bold" />
              </div>
            </div>

            <button onClick={handleStockIn} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-emerald-700 transition shadow-md">Save Purchase</button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Supplier Invoice</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4 text-right">Total Bill</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {purchases.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 text-slate-500">{formatDateTime(p.created_at)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-white">{p.invoice_no}</td>
                  <td className="px-6 py-4 font-medium">{p.supplier_name || 'Cash Purchase'}</td>
                  <td className="px-6 py-4 text-right font-bold">{fmtPKR(p.total_amount)}</td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-bold">{fmtPKR(p.paid_amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {p.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Add New Supplier</h2>
            {supplierError && <div className="bg-red-50 text-red-600 p-2 mb-3 rounded-lg text-sm font-bold flex items-center gap-2"><AlertCircle size={16}/> {supplierError}</div>}
            <div className="space-y-3">
              <input placeholder="Company Name *" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Drug License No" value={newSupplier.license_no} onChange={e => setNewSupplier({...newSupplier, license_no: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Phone Number" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none" />
              <button onClick={addSupplier} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold mt-2 hover:bg-blue-700 transition">Save Supplier</button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
                <tr><th className="px-4 py-3">Company</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.phone}</td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button onClick={() => openLedger(s)} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center justify-center gap-1 transition">
                        <BookOpen size={14}/> Ledger
                      </button>
                      <button onClick={() => { setConfirmDeleteSupplier(s); setDeleteError('') }} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Delete Supplier">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIER LEDGER MODAL */}
      {ledgerSupplier && ledgerData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <div><h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><BookOpen className="text-indigo-500"/> Supplier Ledger</h3><p className="text-sm text-slate-500">{ledgerSupplier.name}</p></div>
              <button onClick={() => setLedgerSupplier(null)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold uppercase">
                    <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {ledgerData.history.map((h: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-100 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDateTime(h.created_at)}</td>
                        <td className="px-4 py-3 font-medium">{h.type === 'Purchase Bill' ? <span className="text-red-500">Bill ({h.invoice_no})</span> : <span className="text-emerald-500">Payment Sent</span>}</td>
                        <td className={`px-4 py-3 text-right font-bold ${h.type === 'Purchase Bill' ? 'text-red-500' : 'text-emerald-500'}`}>{fmtPKR(h.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl text-center">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">You Owe Supplier</p>
                  <p className="text-3xl font-black text-red-600 dark:text-red-400">{fmtPKR(ledgerData.balance)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Pay Supplier</h4>
                  <input type="number" placeholder="Amount (PKR)" value={payAmount || ''} onChange={e => setPayAmount(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 outline-none" />
                  <input placeholder="Notes (e.g. Cash payment)" value={payNotes} onChange={e => setPayNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" />
                  <button onClick={submitPayment} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"><CheckCircle size={18}/> Record Payment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SUPPLIER MODAL */}
      {confirmDeleteSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[400px] shadow-2xl text-center border-t-8 border-red-500">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Supplier?</h3>
            {deleteError ? (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6 font-medium">{deleteError}</p>
            ) : (
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <b>{confirmDeleteSupplier.name}</b>? If they have purchase history, this will fail to protect your records.</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteSupplier(null)} className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300">Cancel</button>
              {!deleteError && <button onClick={executeDeleteSupplier} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md">Delete</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}