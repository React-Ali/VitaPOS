import { useEffect, useState } from 'react'
import { ipc, fmtPKR, formatDateTime } from '../lib/ipc'
import { useAuth } from '../store/auth.store'
import { UserPlus, Edit2, Trash2, User, BookOpen, X, CheckCircle } from 'lucide-react'

export default function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', cnic: '', email: '', address: '', notes: '' })

  // Khata State
  const [ledgerCustomer, setLedgerCustomer] = useState<any | null>(null)
  const [ledgerData, setLedgerData] = useState<any>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payNotes, setPayNotes] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))

  const load = () => {
    if (window.api?.customer?.list) ipc.customer.list().then(setCustomers).catch(console.error)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ name: '', phone: '', cnic: '', email: '', address: '', notes: '' }); setEditId(null); setShowModal(true) }
  const openEdit = (c: any) => { setForm({ ...c }); setEditId(c.id); setShowModal(true) }

  const save = async () => {
    if (!form.name) return alert('Customer name is required')
    try {
      if (editId) await ipc.customer.update(editId, form)
      else await ipc.customer.create(form)
      setShowModal(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => {
    if (confirm('Delete this customer?')) {
      await ipc.customer.delete(id)
      load()
    }
  }

  // Khata Functions
  const openLedger = async (c: any) => {
    setLedgerCustomer(c)
    setPayAmount(0)
    setPayNotes('')
    setLedgerData(await ipc.customer.ledger(c.id))
  }

  const submitPayment = async () => {
    if (payAmount <= 0) return alert('Enter a valid amount')
    await ipc.customer.pay(ledgerCustomer.id, payAmount, payNotes, payDate)
    setPayAmount(0); setPayNotes('')
    setLedgerData(await ipc.customer.ledger(ledgerCustomer.id))
  }

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Customers & Khata</h1>
          <p className="text-sm text-slate-500">Manage patients, contact details, and credit ledgers.</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition">
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">CNIC</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 font-bold flex items-center gap-2"><User size={16} className="text-blue-500"/> {c.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.phone || '—'}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{c.cnic || '—'}</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => openLedger(c)} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center gap-1 transition" title="Khata Ledger">
                    <BookOpen size={14}/> Khata
                  </button>
                  <button onClick={() => openEdit(c)} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition"><Edit2 size={16}/></button>
                  <button onClick={() => del(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No customers added yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* LEDGER MODAL */}
      {ledgerCustomer && ledgerData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><BookOpen className="text-indigo-500"/> Khata Ledger</h3>
                <p className="text-sm text-slate-500">{ledgerCustomer.name} | {ledgerCustomer.phone || 'No Phone'}</p>
              </div>
              <button onClick={() => setLedgerCustomer(null)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto grid grid-cols-3 gap-6">
              {/* History Table */}
              <div className="col-span-2 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold uppercase">
                    <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {ledgerData.history.map((h: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-100 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDateTime(h.created_at)}</td>
                        <td className="px-4 py-3 font-medium">
                          {h.type === 'Credit Sale' ? <span className="text-red-500">Credit Sale ({h.invoice_no})</span> : <span className="text-emerald-500">Payment {h.notes ? `- ${h.notes}` : ''}</span>}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${h.type === 'Credit Sale' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {fmtPKR(h.amount)}
                        </td>
                      </tr>
                    ))}
                    {ledgerData.history.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400">No credit history.</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Payment Panel */}
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl text-center">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Outstanding Balance</p>
                  <p className="text-3xl font-black text-red-600 dark:text-red-400">{fmtPKR(ledgerData.balance)}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Receive Payment</h4>
                  <input type="number" placeholder="Amount (PKR)" value={payAmount || ''} onChange={e => setPayAmount(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 outline-none" />
                  <input placeholder="Notes (e.g. Cash received)" value={payNotes} onChange={e => setPayNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" />
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" />
                  <button onClick={submitPayment} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                    <CheckCircle size={18}/> Record Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[500px] shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{editId ? 'Edit Customer' : 'Add New Customer'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-lg px-4 py-2 col-span-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="Phone Number" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="CNIC" value={form.cnic || ''} onChange={e => setForm({...form, cnic: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Email Address" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-4 py-2 col-span-2 outline-none" />
              <input placeholder="Home Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="w-full border rounded-lg px-4 py-2 col-span-2 outline-none" />
              <textarea placeholder="Medical Notes / Allergies" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full border rounded-lg px-4 py-2 col-span-2 outline-none" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg font-medium bg-slate-200 dark:bg-slate-700">Cancel</button>
              <button onClick={save} className="flex-1 py-2 rounded-lg font-medium text-white bg-emerald-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}