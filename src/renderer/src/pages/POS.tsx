import { useState, useEffect, useRef } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { useCart } from '../store/cart.store'
import { useAuth } from '../store/auth.store'
import { 
  Trash2, Printer, Search, User, Plus, Minus, Stethoscope, Percent, 
  UserPlus, X, AlertCircle, Calculator, HeartPulse, ShieldAlert 
} from 'lucide-react'

export default function POS() {
  const { user } = useAuth()
  const cart = useCart()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [allMeds, setAllMeds] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  
  const [filterType, setFilterType] = useState<'All' | 'Human' | 'Vet' | 'Bakery'>('All')
  
  const [batchPicker, setBatchPicker] = useState<any | null>(null)
  const [lastInvoice, setLastInvoice] = useState<any>(null)
  const [error, setError] = useState('')
  
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [discount, setDiscount] = useState<number>(0)
  const [cashReceived, setCashReceived] = useState<number>(0)
  
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false)
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', cnic: '' })
  const [quickAddError, setQuickAddError] = useState('')
  
  const [controlled, setControlled] = useState<{ cnic: string; doctorId: number | '' } | null>(null)
  
  // Admin Actions
  const isAdmin = user?.role === 'admin'
  const [showHealModal, setShowHealModal] = useState(false)
  const [healStatus, setHealStatus] = useState<string[]>([])
  const [healing, setHealing] = useState(false)
  const [confirmDeleteSale, setConfirmDeleteSale] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadData = () => {
    if (window.api?.medicine?.list) ipc.medicine.list().then(setAllMeds).catch(console.error)
    if (window.api?.customer?.list) ipc.customer.list().then(setCustomers).catch(console.error)
    if (window.api?.doctor?.list) ipc.doctor.list().then(setDoctors).catch(console.error)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.key === 'F4') { e.preventDefault(); if (cart.lines.length > 0) checkout() }
      if (e.key === 'Escape') { 
        setBatchPicker(null); setControlled(null); setShowQuickAddCustomer(false); setLastInvoice(null); setShowHealModal(false) 
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.lines, paymentMethod, discount, controlled])

  const search = async (q: string) => {
    setQuery(q)
    if (!q.trim()) return setResults([])
    try { setResults(await ipc.medicine.search(q)) } catch (err) { console.error(err) }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() && results.length === 1) {
      pickMedicine(results[0])
      setQuery('')
      setResults([])
    }
  }

  const pickMedicine = async (m: any) => {
    if (m.total_qty <= 0) return setError('Out of stock!')
    try {
      const batches = await ipc.medicine.batches(m.id)
      if (!batches || !batches.length) return setError('No batches found for this product.')
      setError('')
      setBatchPicker({ medicine: m, batches })
    } catch (err) { console.error(err) }
  }

  const addToCart = (batch: any) => {
    const m = batchPicker.medicine
    cart.addLine({
      medicineId: m.id, medicineName: m.name, batchId: batch.id, batchNo: batch.batch_no,
      schedule: m.schedule, qty: 1, unitPrice: m.mrp, maxQty: batch.qty
    })
    setBatchPicker(null)
  }

  const handleQuickAddCustomer = async () => {
    if (!newCustForm.name) return setQuickAddError('Name is required')
    setQuickAddError('')
    try {
      await ipc.customer.create(newCustForm)
      const updated = await ipc.customer.list()
      setCustomers(updated)
      setNewCustForm({ name: '', phone: '', cnic: '' })
      setShowQuickAddCustomer(false)
    } catch (err: any) { setQuickAddError(err.message) }
  }

  const checkout = async () => {
    if (!cart.lines.length) return
    const hasControlled = cart.lines.some((l) => l.schedule === 'G' || l.schedule === 'D')
    
    if (hasControlled && !controlled) {
      setControlled({ cnic: '', doctorId: '' })
      return
    }

    if (controlled && (!controlled.cnic || !controlled.doctorId)) {
      return setError("Patient CNIC and Doctor selection are required for controlled drugs.")
    }

    if (paymentMethod === 'Credit' && !cart.customerId) {
      return setError("You must select a customer to record a Credit (Khata) sale.")
    }

    try {
      const selectedDoc = doctors.find(d => d.id === controlled?.doctorId)
      const res = await ipc.sales.create({
        items: cart.lines.map((l) => ({ medicineId: l.medicineId, batchId: l.batchId, qty: l.qty, unitPrice: l.unitPrice, schedule: l.schedule })),
        customerId: cart.customerId || undefined,
        customerCnic: controlled?.cnic,
        doctorId: controlled?.doctorId ? Number(controlled.doctorId) : undefined,
        doctorName: selectedDoc?.name,
        paymentMethod: paymentMethod,
        discount: discount
      }, user!.id)
      
      setLastInvoice({ ...res, items: [...cart.lines], customerName: customers.find(c => c.id === cart.customerId)?.name, cashReceived, change: cashReceived - Math.max(0, cart.total() - discount) })
      cart.clear(); setControlled(null); setError(''); setDiscount(0); setCashReceived(0); loadData()
    } catch (err: any) { setError(err.message); setControlled(null) }
  }

  const voidSale = async () => {
    if (!lastInvoice) return
    try {
      await ipc.sales.delete(lastInvoice.id, user!.id)
      setLastInvoice(null)
      setConfirmDeleteSale(false)
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const runSelfHeal = async () => {
    setHealing(true)
    setHealStatus([])
    try {
      const results = await ipc.system.heal()
      setHealStatus(results)
    } catch (err: any) {
      setHealStatus([`Error: ${err.message}`])
    } finally {
      setHealing(false)
      loadData()
    }
  }

  const printReceipt = async () => {
    if (!lastInvoice) return
    try {
      const settings = await ipc.settings.get()
      
      const itemsHtml = lastInvoice.items.map((l: any) => `
        <tr>
          <td style="text-align:left; width: 50%; word-break: break-word;">${l.medicineName}</td>
          <td style="text-align:center; width: 15%;">${l.qty}</td>
          <td style="text-align:right; width: 35%;">${(l.qty * l.unitPrice).toFixed(2)}</td>
        </tr>
      `).join('')

      const html = `
        <html>
          <head>
            <style>
              @page { size: 80mm 297mm; margin: 0; }
              body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 2mm; color: #000; font-size: 12px; box-sizing: border-box; }
              h2 { margin: 0 0 2px 0; font-size: 16px; text-transform: uppercase; text-align: center; font-weight: bold; }
              .meta { text-align: center; margin: 2px 0; font-size: 11px; }
              .divider { border-top: 1px dashed #000; margin: 6px 0; }
              .info { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
              table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 11px; table-layout: fixed; }
              th { border-bottom: 1px dashed #000; padding-bottom: 2px; text-align: left; }
              td { padding: 2px 0; }
              .totals { margin-top: 6px; font-size: 12px; }
              .totals-row { display: flex; justify-content: space-between; margin: 2px 0; }
              .grand-total { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin: 4px 0; }
              .footer { text-align: center; font-size: 10px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h2>${settings.shop_name || 'VitaPOS'}</h2>
            <div class="meta">${settings.shop_address || ''}</div>
            <div class="meta">Ph: ${settings.shop_phone || ''}</div>
            
            <div class="divider"></div>
            
            <div class="info">
              <span style="width: 60%;">Inv: <b>${lastInvoice.invoiceNo}</b></span>
              <span style="width: 40%; text-align: right;">Date: ${new Date().toLocaleDateString()}</span>
            </div>
            <div class="info">
              <span style="width: 60%;">Cust: ${lastInvoice.customerName || 'Walk-in'}</span>
              <span style="width: 40%; text-align: right;">Pay: ${paymentMethod}</span>
            </div>
            
            <div class="divider"></div>
            
            <table>
              <thead><tr><th style="width: 50%;">Item</th><th style="width: 15%; text-align:center;">Qty</th><th style="width: 35%; text-align:right;">Total</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            
            <div class="divider"></div>
            
            <div class="totals">
              <div class="totals-row"><span>Subtotal:</span><span>${lastInvoice.total.toFixed(2)}</span></div>
              ${discount > 0 ? `<div class="totals-row"><span>Discount:</span><span>-${discount.toFixed(2)}</span></div>` : ''}
              <div class="totals-row grand-total"><span>TOTAL:</span><span>Rs. ${lastInvoice.total.toFixed(2)}</span></div>
            </div>
            
            <div class="footer"><p style="margin:2px 0;">${settings.receipt_footer || 'Thank you!'}</p></div>
          </body>
        </html>
      `
      ipc.print.receipt(html)
    } catch (err) { alert("Failed to print receipt") }
  }

  const finalTotal = Math.max(0, cart.total() - discount)
  const change = Math.max(0, cashReceived - finalTotal)
  const baseList = query.trim() ? results : allMeds
  const displayMeds = filterType === 'All' ? baseList : baseList.filter((m: any) => m.product_type === filterType)

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      
      {/* QUICK ADD MODAL */}
      {showQuickAddCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Quick Add Customer</h3><button onClick={() => setShowQuickAddCustomer(false)}><X size={20}/></button></div>
            {quickAddError && <div className="bg-red-50 text-red-600 p-2 mb-3 rounded-lg text-sm font-bold flex items-center gap-2"><AlertCircle size={16}/> {quickAddError}</div>}
            <div className="space-y-3">
              <input placeholder="Full Name *" value={newCustForm.name} onChange={e => setNewCustForm({...newCustForm, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none" />
              <input placeholder="Phone Number" value={newCustForm.phone} onChange={e => setNewCustForm({...newCustForm, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none" />
              <button onClick={handleQuickAddCustomer} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold mt-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* SELF HEAL MODAL (Admin Only) */}
      {showHealModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[500px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-emerald-600 flex items-center gap-2"><HeartPulse /> System Self-Heal</h3>
              <button onClick={() => setShowHealModal(false)}><X size={20}/></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">This will fix negative stock, remove orphaned records, and optimize the database. It is safe to run anytime.</p>
            
            {healStatus.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-4 max-h-40 overflow-y-auto">
                {healStatus.map((msg, i) => (
                  <p key={i} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> {msg}
                  </p>
                ))}
              </div>
            )}

            <button onClick={runSelfHeal} disabled={healing} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
              {healing ? 'Healing Database...' : 'Run Diagnostics & Heal'}
            </button>
          </div>
        </div>
      )}

      {/* LEFT PANEL (SEARCH) */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-3">
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
            {['All', 'Human', 'Vet', 'Bakery'].map((t: any) => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition ${filterType === t ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => setShowHealModal(true)} className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition">
              <HeartPulse size={14} /> Self-Heal
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input ref={searchInputRef} value={query} onChange={(e) => search(e.target.value)} onKeyDown={handleKeyDown} placeholder="Scan barcode or search... (F2)" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-lg bg-white dark:bg-slate-800 font-medium" autoFocus />
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-y-auto">
          {displayMeds.length === 0 && <p className="text-center text-slate-400 mt-10">No products found.</p>}
          {displayMeds.map((m) => (
            <button key={m.id} onClick={() => pickMedicine(m)} className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 flex justify-between items-center transition">
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-lg">{m.name}</p>
                <p className="text-sm text-slate-500">{m.product_type} {m.generic_name ? `• ${m.generic_name}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{fmtPKR(m.mrp)}</p>
                <p className={`text-xs ${m.total_qty < 10 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>{m.total_qty} in stock</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL (CART) */}
      <div className="w-[420px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-2.5 text-slate-400" size={16}/>
            <select value={cart.customerId} onChange={e => cart.setCustomer(Number(e.target.value))} className="w-full pl-9 pr-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg outline-none text-sm font-medium">
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={() => setShowQuickAddCustomer(true)} className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-200 transition"><UserPlus size={18}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.lines.map((l) => (
            <div key={l.batchId} className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div><p className="font-bold text-slate-800 dark:text-white text-sm">{l.medicineName}</p><p className="text-xs text-slate-500">Batch: {l.batchNo}</p></div>
                <button onClick={() => cart.removeLine(l.batchId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-1">
                  <button onClick={() => cart.updateQty(l.batchId, l.qty - 1)} disabled={l.qty <= 1} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><Minus size={12}/></button>
                  <input type="number" value={l.qty} onChange={(e) => cart.updateQty(l.batchId, Number(e.target.value))} className="w-10 text-center text-xs font-bold outline-none bg-transparent" min="1" max={l.maxQty} />
                  <button onClick={() => cart.updateQty(l.batchId, l.qty + 1)} disabled={l.qty >= l.maxQty} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><Plus size={12}/></button>
                </div>
                <p className="font-black text-slate-800 dark:text-white text-base">{fmtPKR(l.qty * l.unitPrice)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl">
          {error && <p className="text-red-500 text-xs mb-2 font-medium bg-red-50 p-2 rounded flex items-center gap-2"><AlertCircle size={14}/> {error}</p>}
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center text-sm font-medium"><span className="text-slate-500">Subtotal</span><span>{fmtPKR(cart.total())}</span></div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-500 flex items-center gap-1"><Percent size={14}/> Discount</span>
              <div className="flex items-center gap-2"><span className="text-slate-400">Rs.</span><input type="number" min="0" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} className="w-20 text-right border rounded-md px-2 py-1 outline-none font-bold" /></div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-slate-800 dark:text-white font-black uppercase text-xs">Total</span>
              <span className="text-2xl font-black text-emerald-600">{fmtPKR(finalTotal)}</span>
            </div>
          </div>

          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold mb-3 outline-none">
            <option value="Cash">💵 Cash Payment</option>
            <option value="Card">💳 Credit/Debit Card</option>
            <option value="Online">📱 JazzCash / EasyPaisa</option>
            <option value="Credit">📝 Pay on Credit (Khata)</option>
          </select>

          {paymentMethod === 'Cash' && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500 font-medium flex items-center gap-1"><Calculator size={14}/> Cash Received</span>
                <input type="number" placeholder="0" value={cashReceived || ''} onChange={(e) => setCashReceived(Number(e.target.value))} className="w-24 text-right border rounded-md px-2 py-1 outline-none font-bold" />
              </div>
              {cashReceived > 0 && (
                <div className="flex justify-between items-center text-sm font-bold text-emerald-600 border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>Change to Return:</span>
                  <span>{fmtPKR(change)}</span>
                </div>
              )}
            </div>
          )}

          <button onClick={checkout} disabled={!cart.lines.length} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-200">Checkout (F4)</button>
        </div>
      </div>

      {/* BATCH MODAL */}
      {batchPicker && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Select Batch</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {batchPicker.batches.map((b: any) => {
                const isExpired = b.expiry_date < new Date().toISOString().slice(0, 10)
                return (
                  <button key={b.id} onClick={() => !isExpired && addToCart(b)} disabled={isExpired} className={`w-full text-left border p-3 rounded-xl ${isExpired ? 'border-red-200 bg-red-50 opacity-60' : 'border-slate-200 hover:border-emerald-500'}`}>
                    <div className="flex justify-between items-center"><span className="font-bold">{b.batch_no}</span>{isExpired && <span className="text-xs font-bold text-red-600">EXPIRED</span>}</div>
                    <div className="text-sm text-slate-500 mt-1">Exp: {b.expiry_date} | Qty: {b.qty}</div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setBatchPicker(null)} className="mt-4 w-full py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* CONTROLLED DRUG MODAL */}
      {controlled && (
        <div className="fixed inset-0 bg-red-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[450px] shadow-2xl border-t-8 border-red-600">
            <h3 className="font-bold text-xl text-red-700 mb-2 flex items-center gap-2"><Stethoscope/> Prescription Required</h3>
            <div className="space-y-4">
              <input placeholder="Patient CNIC" value={controlled.cnic} onChange={(e) => setControlled({ ...controlled, cnic: e.target.value })} className="w-full border rounded-lg px-3 py-2 outline-none" />
              <select value={controlled.doctorId} onChange={(e) => setControlled({ ...controlled, doctorId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 outline-none">
                <option value="">Select Doctor...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setControlled(null)} className="flex-1 py-2 rounded-lg bg-slate-200">Cancel</button>
              <button onClick={checkout} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold">Confirm Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT / SUCCESS MODAL */}
      {lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-96 text-center shadow-2xl">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Printer size={32} /></div>
            <h3 className="text-2xl font-bold mb-1">Sale Complete</h3>
            <p className="text-slate-500 mb-4">Invoice: <b>{lastInvoice.invoiceNo}</b></p>
            <p className="text-3xl font-extrabold text-emerald-600 mb-2">{fmtPKR(lastInvoice.total)}</p>
            {paymentMethod === 'Cash' && lastInvoice.cashReceived > 0 && (
              <p className="text-sm font-bold text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                Cash: {fmtPKR(lastInvoice.cashReceived)} | Change: <span className="text-emerald-600">{fmtPKR(lastInvoice.change)}</span>
              </p>
            )}
            
            <button onClick={printReceipt} className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-medium hover:bg-slate-900 transition mb-2 shadow-md">
              <Printer size={18} /> Print Receipt
            </button>
            
            {/* ADMIN ONLY: DELETE SALE */}
            {isAdmin && !confirmDeleteSale && (
              <button onClick={() => setConfirmDeleteSale(true)} className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-bold py-2 hover:bg-red-50 rounded-lg transition mb-2">
                <Trash2 size={16} /> Void Sale (Admin)
              </button>
            )}

            {confirmDeleteSale && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-2">
                <p className="text-xs text-red-600 font-bold mb-2 flex items-center justify-center gap-1"><ShieldAlert size={14}/> Permanently delete this sale?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDeleteSale(false)} className="flex-1 text-xs font-bold bg-white py-1 rounded">Cancel</button>
                  <button onClick={voidSale} className="flex-1 text-xs font-bold bg-red-600 text-white py-1 rounded">Delete</button>
                </div>
              </div>
            )}

            <button onClick={() => { setLastInvoice(null); setConfirmDeleteSale(false); }} className="w-full py-3 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 mt-2">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}