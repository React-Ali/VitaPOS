import { useEffect, useState } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { DollarSign } from 'lucide-react'

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ category: 'Rent', amount: 0, description: '', date: new Date().toISOString().slice(0,10) })

  const load = async () => {
    try {
      const data = await ipc.expense.list()
      setExpenses(data || [])
    } catch (err) {
      console.error("Failed to load expenses", err)
    }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      await ipc.expense.create(form)
      setShowAdd(false)
      setForm({ category: 'Rent', amount: 0, description: '', date: new Date().toISOString().slice(0,10) })
      load()
    } catch (err) {
      alert("Failed to save expense")
    }
  }

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">Track shop rent, utilities, and salaries.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition shadow-sm">+ Add Expense</button>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-700 flex items-center gap-4 mb-6">
        <div className="p-4 bg-slate-700 text-emerald-400 rounded-xl"><DollarSign size={32} /></div>
        <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Total Expenses Recorded</p>
          <p className="text-3xl font-black text-white">{fmtPKR(totalExpense)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-600">{e.date}</td>
                <td className="px-6 py-4"><span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-bold">{e.category}</span></td>
                <td className="px-6 py-4 text-slate-500">{e.description}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-800">{fmtPKR(e.amount)}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No expenses recorded.</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Record Expense</h3>
            <div className="space-y-4">
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-slate-500 outline-none">
                <option>Rent</option><option>Electricity</option><option>Salaries</option><option>Transport</option><option>Other</option>
              </select>
              <input type="number" placeholder="Amount (PKR)" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Description (e.g. August Rent)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
              <button onClick={save} className="flex-1 py-2 rounded-lg font-medium text-white bg-slate-800 hover:bg-slate-900">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}