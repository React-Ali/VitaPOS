import { useEffect, useState } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { downloadCSV } from '../lib/export'
import { useAuth } from '../store/auth.store'
import { Plus, Edit2, Trash2, Box, AlertCircle, Barcode, FileDown, X, AlertTriangle } from 'lucide-react'

export default function Medicines() {
  const { user } = useAuth()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'All' | 'Human' | 'Vet' | 'Bakery'>('All')
  
  const [showAddMed, setShowAddMed] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [medError, setMedError] = useState('')

  const [managingBatches, setManagingBatches] = useState<any | null>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [showAddBatch, setShowAddBatch] = useState(false)
  const [editBatchId, setEditBatchId] = useState<number | null>(null)
  const [batchError, setBatchError] = useState('')

  // Custom Confirm States
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
      setConfirmDeleteMed(null)
      load()
    } catch (e) { console.error(e) }
  }

  const executeDeleteBatch = async () => {
    if (!confirmDeleteBatch) return
    try {
      await ipc.inventory.deleteBatch(confirmDeleteBatch)
      setBatches(await ipc.medicine.batches(managingBatches.id))
      setConfirmDeleteBatch(null)
      load()
    } catch (e) { console.error(e) }
  }

  const printBarcode = (med: any) => {
    const barcodeValue = med.barcode || med.id.toString().padStart(6, '0')
    const html = `<html><head><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><style>body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #fff;} .label { border: 1px solid #000; padding: 10px; text-align: center; width: 250px; border-radius: 4px; } svg { max-width: 100%; }</style></head><body><div class="label"><h3 style="margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase;">${med.name}</h3><p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">MRP: Rs. ${med.mrp}</p><svg id="barcode"></svg></div><script>JsBarcode("#barcode", "${barcodeValue}", { format: "CODE128", displayValue: true, fontSize: 14, margin: 0 }); setTimeout(() => { window.print(); }, 800);</script></body></html>`
    ipc.print.receipt(html)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isAdmin = user?.role === 'admin'
  const displayRows = filterType === 'All' ? rows : rows.filter(r => r.product_type === filterType)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Products Catalog</h1>
          <p className="text-sm text-slate-500">Manage medicines, bakery, and vet items.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => { setEditId(null); setMedForm({ name: '', generic_name: '', brand: '', category: '', unit: 'Tablet', pack_size: 1, barcode: '', mrp: 0, purchase_price: 0, schedule: 'none', product_type: 'Human' }); setMedError(''); setShowAddMed(true) }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm">
              <Plus size={18} /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-fit mb-6">
        {['All', 'Human', 'Vet', 'Bakery'].map((t: any) => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${filterType === t ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
            {t === 'Human' ? '💊 Human Medicine' : t === 'Vet' ? '🐾 Vet Medicine' : t === 'Bakery' ? '🍞 Bakery' : 'All Products'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
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
                  <span className={`px-2 py-1 rounded text-xs font-bold ${m.product_type === 'Bakery' ? 'bg-amber-100 text-amber-700' : m.product_type === 'Vet' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {m.product_type || 'Human'}
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
            {displayRows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No products found for this category.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* CUSTOM CONFIRM DELETE MED MODAL */}
      {confirmDeleteMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[400px] shadow-2xl text-center border-t-8 border-red-500">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to permanently delete <b>{confirmDeleteMed.name}</b>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteMed(null)} className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300">Cancel</button>
              <button onClick={executeDeleteMed} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showAddMed && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit Product' : 'Add New Product'}</h3>
              </div>
              <button onClick={() => setShowAddMed(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={24}/></button>
            </div>
            
            {medError && <div className="bg-red-50 text-red-600 p-3 text-sm font-bold border-b border-red-100 flex items-center gap-2"><AlertCircle size={16}/> {medError}</div>}

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-700 pb-1">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Product Name *</label>
                    <input placeholder="e.g. Panadol / Cake" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Product Type</label>
                    <select value={medForm.product_type} onChange={e => setMedForm({...medForm, product_type: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2.5 outline-none">
                      <option value="Human">💊 Human Medicine</option>
                      <option value="Vet">🐾 Vet Medicine</option>
                      <option value="Bakery">🍞 Bakery Item</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Generic/Brand</label>
                    <input placeholder="e.g. Paracetamol" value={medForm.generic_name} onChange={e => setMedForm({...medForm, generic_name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Category</label>
                    <input placeholder="e.g. Antibiotic" value={medForm.category} onChange={e => setMedForm({...medForm, category: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-700 pb-1">Pricing</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Cost Price (Rs.)</label>
                    <input type="number" placeholder="0.00" value={medForm.purchase_price || ''} onChange={e => setMedForm({...medForm, purchase_price: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">MRP *</label>
                    <input type="number" placeholder="0.00" value={medForm.mrp || ''} onChange={e => setMedForm({...medForm, mrp: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Schedule</label>
                    <select value={medForm.schedule} onChange={e => setMedForm({...medForm, schedule: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2.5 outline-none">
                      <option value="none">None (OTC)</option>
                      <option value="H">Schedule H</option>
                      <option value="G">Schedule G</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-700 pb-1">Inventory</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Barcode</label>
                    <input placeholder="Scan or type..." value={medForm.barcode} onChange={e => setMedForm({...medForm, barcode: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Unit</label>
                    <select value={medForm.unit} onChange={e => setMedForm({...medForm, unit: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2.5 outline-none">
                      <option value="Tablet">Tablet</option><option value="Bottle">Bottle</option><option value="Box">Box</option><option value="Piece">Piece</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Pack Size</label>
                    <input type="number" placeholder="e.g. 10" value={medForm.pack_size || ''} onChange={e => setMedForm({...medForm, pack_size: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button onClick={() => setShowAddMed(false)} className="flex-1 py-2.5 rounded-lg font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition">Cancel</button>
              <button onClick={saveMed} className="flex-1 py-2.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">Save Product</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE BATCH MODAL */}
      {confirmDeleteBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[400px] shadow-2xl text-center border-t-8 border-red-500">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Batch?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this batch? This will remove the stock permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteBatch(null)} className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300">Cancel</button>
              <button onClick={executeDeleteBatch} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH MANAGER MODAL */}
      {managingBatches && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[700px] shadow-2xl max-h-[90vh] flex flex-col">
             <div className="flex justify-between items-center mb-4">
              <div><h3 className="text-xl font-bold text-slate-800 dark:text-white">Manage Batches</h3><p className="text-sm text-slate-500">{managingBatches.name}</p></div>
              <button onClick={() => setManagingBatches(null)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
            </div>
            {batchError && <div className="bg-red-50 text-red-600 p-3 text-sm font-bold border border-red-100 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={16}/> {batchError}</div>}
            {!showAddBatch ? (
              <>
                <div className="overflow-y-auto flex-1 mb-4"><table className="w-full text-sm text-left"><thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold"><tr><th className="px-3 py-2">Batch No</th><th className="px-3 py-2">Expiry Date</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Cost Price</th><th className="px-3 py-2 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{batches.map(b => (<tr key={b.id} className={b.expiry_date < today ? 'bg-red-50/50' : ''}><td className="px-3 py-3 font-mono font-bold">{b.batch_no}</td><td className="px-3 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${b.expiry_date < today ? 'bg-red-200 text-red-800' : 'bg-slate-100 dark:bg-slate-700'}`}>{b.expiry_date}</span></td><td className="px-3 py-3 text-right font-bold">{b.qty}</td><td className="px-3 py-3 text-right text-slate-500">{fmtPKR(b.cost_price)}</td><td className="px-3 py-3 flex justify-center gap-2"><button onClick={() => { setBatchForm({ batch_no: b.batch_no, expiry_date: b.expiry_date, qty: b.qty, cost_price: b.cost_price }); setEditBatchId(b.id); setShowAddBatch(true); setBatchError(''); }} className="text-amber-600 hover:bg-amber-50 p-1.5 rounded"><Edit2 size={14}/></button><button onClick={() => setConfirmDeleteBatch(b.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={14}/></button></td></tr>))}</tbody></table></div>
                <button onClick={() => { setBatchForm({ batch_no: '', expiry_date: '', qty: 0, cost_price: 0 }); setEditBatchId(null); setShowAddBatch(true); setBatchError(''); }} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700">+ Add New Batch</button>
              </>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><h4 className="font-bold mb-3">{editBatchId ? 'Edit Batch' : 'New Batch'}</h4><div className="space-y-3"><input placeholder="Batch Number" value={batchForm.batch_no} onChange={e => setBatchForm({...batchForm, batch_no: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none" /><div><label className="text-xs font-bold text-slate-500 block mb-1">Expiry Date</label><input type="date" value={batchForm.expiry_date} onChange={e => setBatchForm({...batchForm, expiry_date: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none" /></div><div className="grid grid-cols-2 gap-3"><input type="number" placeholder="Quantity" value={batchForm.qty || ''} onChange={e => setBatchForm({...batchForm, qty: Number(e.target.value)})} className="border rounded-lg px-3 py-2 outline-none" /><input type="number" placeholder="Cost Price" value={batchForm.cost_price || ''} onChange={e => setBatchForm({...batchForm, cost_price: Number(e.target.value)})} className="border rounded-lg px-3 py-2 outline-none" /></div></div><div className="flex gap-2 mt-4"><button onClick={() => setShowAddBatch(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 py-2 rounded-lg font-medium">Cancel</button><button onClick={saveBatch} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">Save Batch</button></div></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}