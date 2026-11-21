import { useEffect, useState } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { Plus, DollarSign, Receipt, TrendingDown, X, AlertCircle } from 'lucide-react'

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ category: 'Rent', amount: 0, description: '', date: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')

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
    if (form.amount <= 0) return setError('Amount must be greater than 0')
    setError('')
    try {
      await ipc.expense.create(form)
      setShowAdd(false)
      setForm({ category: 'Rent', amount: 0, description: '', date: new Date().toISOString().slice(0, 10) })
      load()
    } catch (err) {
      setError('Failed to save expense')
    }
  }

  // Calculate totals for the dashboard
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const thisMonth = new Date().getMonth()
  const monthlyExpense = expenses.filter(e => new Date(e.date).getMonth() === thisMonth).reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Expenses</h1>
          <p className="text-slate-500 mt-1">Track shop rent, utilities, and daily costs.</p>
        </div>
        <button onClick={() => { setShowAdd(true); setError('') }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 font-bold">
          <Plus size={20} /> Add Expense
        </button>
      </div>

      {/* NEW: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg flex items-center justify-between border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} className="text-white"/></div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Expenses (All Time)</p>
            <p className="text-4xl font-black text-white">{fmtPKR(totalExpense)}</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl text-emerald-400 shadow-inner z-10"><Receipt size={32}/></div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown size={80} className="text-red-500"/></div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">This Month</p>
            <p className="text-4xl font-black text-slate-800 dark:text-white">{fmtPKR(monthlyExpense)}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 shadow-sm z-10"><TrendingDown size={32}/></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{e.date}</td>
                <td className="px-6 py-4">
                  <span className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-3 py-1 rounded-lg text-xs font-bold">
                    {e.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{e.description || '—'}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">{fmtPKR(e.amount)}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Receipt size={48} className="mb-4 opacity-20" />
                    <p className="font-medium text-lg">No expenses recorded yet.</p>
                    <p className="text-sm mt-1">Click "Add Expense" to start tracking your business costs.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[450px] shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Record New Expense</h3>
            
            {error && <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-lg text-sm font-bold flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Rent</option><option>Electricity</option><option>Salaries</option><option>Transport</option><option>Maintenance</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Amount (PKR)</label>
                <input type="number" placeholder="0.00" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <input placeholder="e.g. August Electricity Bill" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg transition">Save Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}