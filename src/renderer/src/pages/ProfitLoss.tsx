import { useState } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { downloadCSV } from '../lib/export'
import { TrendingUp, TrendingDown, DollarSign, Calculator, Download, AlertCircle, Printer } from 'lucide-react'

export default function ProfitLoss() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await ipc.report.pnl(startDate, endDate))
    } catch (err: any) {
      setError(err.message || 'Failed to load P&L data. Make sure you have sales in this date range.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!data) return
    const headers = ['Metric', 'Amount (PKR)']
    const rows = [
      ['Total Revenue (Sales)', data.revenue.toFixed(2)],
      ['Cost of Goods Sold (COGS)', data.cogs.toFixed(2)],
      ['Gross Profit (Revenue - COGS)', (data.revenue - data.cogs).toFixed(2)],
      ['Total Operating Expenses', data.expenses.toFixed(2)],
      ['Net Profit', data.netProfit.toFixed(2)]
    ]
    downloadCSV(`Profit_Loss_${startDate}_to_${endDate}.csv`, headers, rows)
  }

  const printReport = () => {
    if (!data) return
    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #000; }
            h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 12px; text-align: left; }
            th { background: #eee; }
            .total { font-weight: bold; background: #f0fdf4; }
          </style>
        </head>
        <body>
          <h1>Profit & Loss Statement</h1>
          <div class="meta">
            <span>Date Range: ${startDate} to ${endDate}</span>
            <span>Generated: ${new Date().toLocaleString()}</span>
          </div>
          <table>
            <tr><th>Metric</th><th>Amount (PKR)</th></tr>
            <tr><td>Total Revenue (Sales)</td><td>${fmtPKR(data.revenue)}</td></tr>
            <tr><td>Cost of Goods Sold (COGS)</td><td>${fmtPKR(data.cogs)}</td></tr>
            <tr><td>Gross Profit (Revenue - COGS)</td><td>${fmtPKR(data.revenue - data.cogs)}</td></tr>
            <tr><td>Total Operating Expenses</td><td>${fmtPKR(data.expenses)}</td></tr>
            <tr class="total"><td>Net Profit</td><td>${fmtPKR(data.netProfit)}</td></tr>
          </table>
        </body>
      </html>
    `
    ipc.print.a4(html)
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profit & Loss Statement</h1>
          <p className="text-sm text-slate-500">Analyze your true net profit after expenses.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button onClick={load} disabled={loading} className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-900 transition disabled:opacity-50 h-[42px]">
          {loading ? 'Calculating...' : 'Generate Statement'}
        </button>
        {data && (
          <div className="flex gap-2 ml-auto">
            <button onClick={printReport} className="bg-slate-800 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 transition h-[42px]">
              <Printer size={18} /> Print
            </button>
            <button onClick={exportData} className="bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-200 transition h-[42px]">
              <Download size={18} /> Export Excel
            </button>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 font-medium"><AlertCircle size={20}/> {error}</div>}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><DollarSign size={28} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{fmtPKR(data.revenue)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-xl"><TrendingDown size={28} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cost of Goods (COGS)</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{fmtPKR(data.cogs)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-4 bg-red-100 text-red-600 rounded-xl"><TrendingDown size={28} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Operating Expenses</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{fmtPKR(data.expenses)}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 shadow-lg flex items-center gap-4">
              <div className="p-4 bg-emerald-500 text-white rounded-xl"><Calculator size={28} /></div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Net Profit / (Loss)</p>
                <p className="text-3xl font-black text-white">{fmtPKR(data.netProfit)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}