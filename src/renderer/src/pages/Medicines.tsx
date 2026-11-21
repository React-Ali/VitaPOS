import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ipc, fmtPKR } from '../lib/ipc'
import { useAuth } from '../store/auth.store'
import { 
  Plus, Edit2, Trash2, Box, AlertCircle, Barcode, FileDown, X, AlertTriangle, 
  Pill, Dog, Cake, CheckCircle
} from 'lucide-react'
import { downloadCSV } from '../lib/export'

export default function Medicines() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'All' | 'Human' | 'Vet' | 'Bakery'>('All')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  
  const [showAddMed, setShowAddMed] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [medError, setMedError] = useState('')

  const [managingBatches, setManagingBatches] = useState<any | null>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [showAddBatch, setShowAddBatch] = useState(false)
  const [editBatchId, setEditBatchId] = useState<number | null>(null)
  const [batchError, setBatchError] = useState('')

  const [confirmDeleteMed, setConfirmDeleteMed] = useState<any | null>(null)
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<number | null>(null)

  const [medForm, setMedForm] = useState({ 
    name: '', generic_name: '', brand: '', category: '', 
    unit: 'Tablet', pack_size: 1, barcode: '', mrp: 0, purchase_price: 0, schedule: 'none', product_type: 'Human' 
  })
  const [batchForm, setBatchForm] = useState({ batch_no: '', expiry_date: '', qty: 0, cost_price: 0 })

  const load = async () => {
    try {
      setLoading(true)
      setRows(await ipc.medicine.list())
    } catch (err: any) { console.error(err) } finally { setLoading(false) }
  }
  
  useEffect(() => { load() }, [])

  // When the URL changes (from notification), update search
  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearchQuery(q)
  }, [searchParams])

  // FIXED: Clear search when switching tabs
  const handleTabClick = (tab: any) => {
    setFilterType(tab)
    setSearchQuery('')
    setSearchParams({}) // Clears the URL query parameter
  }

  const saveMed = async () => {
    if (!medForm.name || medForm.mrp <= 0) return setMedError('Medicine Name and MRP are required')
    setMedError('')
    try {
      if (editId) await ipc.medicine.update(editId, medForm, user!.id)
      else await ipc.medicine.create(medForm, user!.id)
      setShowAddMed(false); load()
    } catch (e: any) { setMedError(e.message) }
  }

  const openBatchManager = async (med: any) => {
    setManagingBatches(med); setBatches(await ipc.medicine.batches(med.id)); setShowAddBatch(false); setBatchError('')
  }

  const saveBatch = async () => {
    if (!batchForm.batch_no || !batchForm.expiry_date) return setBatchError('Batch Number and Expiry Date are required')
    setBatchError('')
    try {
      if (editBatchId) await ipc.inventory.updateBatch(editBatchId, batchForm)
      else await ipc.inventory.addStock({ medicineId: managingBatches.id, batchNo: batchForm.batch_no, expiryDate: batchForm.expiry_date, qty: batchForm.qty, costPrice: batchForm.cost_price, invoiceNo: 'Manual Batch Entry' }, user!.id)
      setShowAddBatch(false); setBatches(await ipc.medicine.batches(managingBatches.id)); load()
    } catch (e: any) { setBatchError(e.message) }
  }

  const executeDeleteMed = async () => {
    if (!confirmDeleteMed) return
    try {
      await ipc.medicine.delete(confirmDeleteMed.id, user!.id)
      setConfirmDeleteMed(null); load()
    } catch (e) { console.error(e) }
  }

  const executeDeleteBatch = async () => {
    if (!confirmDeleteBatch) return
    try {
      await ipc.inventory.deleteBatch(confirmDeleteBatch)
      setBatches(await ipc.medicine.batches(managingBatches.id))
      setConfirmDeleteBatch(null); load()
    } catch (e) { console.error(e) }
  }

  const printBarcode = (med: any) => {
    const barcodeValue = med.barcode || med.id.toString().padStart(6, '0')
    const html = `<html><head><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><style>body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #fff;} .label { border: 1px solid #000; padding: 10px; text-align: center; width: 250px; border-radius: 4px; } svg { max-width: 100%; }</style></head><body><div class="label"><h3 style="margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase;">${med.name}</h3><p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">MRP: Rs. ${med.mrp}</p><svg id="barcode"></svg></div><script>JsBarcode("#barcode", "${barcodeValue}", { format: "CODE128", displayValue: true, fontSize: 14, margin: 0 }); setTimeout(() => { window.print(); }, 800);</script></body></html>`
    ipc.print.receipt(html)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isAdmin = user?.role === 'admin'

  // Filter by type and search query
  let displayRows = filterType === 'All' ? rows : rows.filter(r => r.product_type === filterType)
  if (searchQuery.trim()) {
    displayRows = displayRows.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.generic_name && r.generic_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const ProductIcon = ({ type }: { type: string }) => {
    if (type === 'Vet') return <Dog size={18} className="text-blue-500" />
    if (type === 'Bakery') return <Cake size={18} className="text-amber-500" />
    return <Pill size={18} className="text-emerald-500" />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Products Catalog</h1>
          <p className="text-sm text-slate-500">Manage medicines, bakery, and vet items.</p>
        </div>
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          {isAdmin && (
            <button onClick={() => { setEditId(null); setMedForm({ name: '', generic_name: '', brand: '', category: '', unit: 'Tablet', pack_size: 1, barcode: '', mrp: 0, purchase_price: 0, schedule: 'none', product_type: 'Human' }); setMedError(''); setShowAddMed(true) }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm">
              <Plus size={18} /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-fit mb-6">
        {['All', 'Human', 'Vet', 'Bakery'].map((t: any) => (
          <button key={t} onClick={() => handleTabClick(t)} className={`px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${filterType === t ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
            {t !== 'All' && <ProductIcon type={t} />}
            {t === 'All' ? 'All Products' : t}
          </button>
        ))}
      </div>

      {/* ... The rest of the table and modals are identical to your previous code ... */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Cost Price</th>
              <th className="px-6 py-4 text-right">MRP</th>
              <th className="px-6 py-4 text-center">Total Stock</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {displayRows.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                  {m.name}
                  {m.schedule !== 'none' && <span className="ml-2 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px]">{m.schedule}</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${m.product_type === 'Bakery' ? 'bg-amber-100 text-amber-700' : m.product_type === 'Vet' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    <ProductIcon type={m.product_type} /> {m.product_type || 'Human'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-slate-500 font-medium">{fmtPKR(m.purchase_price || 0)}</td>
                <td className="px-6 py-4 text-right font-bold text-emerald-600">{fmtPKR(m.mrp)}</td>
                <td className="px-6 py-4 text-center font-bold text-lg">
                  <span className={m.total_qty < 10 ? 'text-red-500' : 'text-slate-800 dark:text-white'}>{m.total_qty}</span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => printBarcode(m)} className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"><Barcode size={14} /> Label</button>
                  {isAdmin && (
                    <>
                      <button onClick={() => openBatchManager(m)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"><Box size={14} /> Batches</button>
                      <button onClick={() => { setEditId(m.id); setMedForm(m); setMedError(''); setShowAddMed(true) }} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition"><Edit2 size={16} /></button>
                      <button onClick={() => setConfirmDeleteMed(m)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {displayRows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No products found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modals for Batch, Add/Edit, Delete are identical to previous versions */}
      {showAddMed && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <div><h3 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit Product' : 'Add New Product'}</h3></div>
              <button onClick={() => setShowAddMed(false)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
            </div>
            {medError && <div className="bg-red-50 text-red-600 p-3 text-sm font-bold border-b border-red-100 flex items-center gap-2"><AlertCircle size={16}/> {medError}</div>}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Form inputs... */}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button onClick={() => setShowAddMed(false)} className="flex-1 py-2.5 rounded-lg font-bold bg-slate-200 dark:bg-slate-700">Cancel</button>
              <button onClick={saveMed} className="flex-1 py-2.5 rounded-lg font-bold text-white bg-emerald-600">Save Product</button>
            </div>
          </div>
        </div>
      )}
      {/* ... (Keep your existing Batch and Delete modals here) ... */}
    </div>
  )
}