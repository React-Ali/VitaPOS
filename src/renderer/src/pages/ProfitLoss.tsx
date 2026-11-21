import { useState } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { downloadCSV } from '../lib/export'
import { TrendingUp, TrendingDown, DollarSign, Calculator, Download, AlertCircle, Printer, FileText, PieChart } from 'lucide-react'

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
      setError(err.message || 'Failed to load P&L data.')
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
      ['Gross Profit', (data.revenue - data.cogs).toFixed(2)],
      ['Total Operating Expenses', data.expenses.toFixed(2)],
      ['Net Profit', data.netProfit.toFixed(2)]
    ]
    downloadCSV(`Profit_Loss_${startDate}_to_${endDate}.csv`, headers, rows)
  }

  const printReport = () => {
    if (!data) return
    const html = `
      <html><head><style>body { font-family: sans-serif; padding: 40px; } h1 { text-align: center; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #000; padding: 12px; text-align: left; } .total { font-weight: bold; background: #f0fdf4; }</style></head>
      <body><h1>Profit & Loss Statement</h1><p>Date Range: ${startDate} to ${endDate}</p><p>Generated: ${new Date().toLocaleString()}</p>
      <table>
        <tr><th>Metric</th><th>Amount (PKR)</th></tr>
        <tr><td>Total Revenue</td><td>${fmtPKR(data.revenue)}</td></tr>
        <tr><td>Cost of Goods Sold (COGS)</td><td>${fmtPKR(data.cogs)}</td></tr>
        <tr><td>Operating Expenses</td><td>${fmtPKR(data.expenses)}</td></tr>
        <tr class="total"><td>Net Profit</td><td>${fmtPKR(data.netProfit)}</td></tr>
      </table></body></html>
    `
    ipc.print.a4(html)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Profit & Loss Statement</h1>
          <p className="text-slate-500 mt-1">Analyze your true net profit after expenses.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
        </div>
        <button onClick={load} disabled={loading} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition disabled:opacity-50 h-[50px] shadow-lg shadow-slate-500/20">
          {loading ? 'Calculating...' : 'Generate Statement'}
        </button>
        {data && (
          <div className="flex gap-2 ml-auto">
            <button onClick={printReport} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-300 transition h-[50px]">
              <Printer size={18} /> Print
            </button>
            <button onClick={exportData} className="bg-emerald-100 text-emerald-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-200 transition h-[50px]">
              <Download size={18} /> Export Excel
            </button>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 font-bold"><AlertCircle size={20}/> {error}</div>}

      {/* SKELETON LOADER / EMPTY STATE */}
      {!data && !loading && !error && (
        <div className="grid grid-cols-2 gap-6 opacity-40">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 h-40 flex flex-col justify-center">
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="w-48 h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 h-40 flex flex-col justify-center">
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="w-48 h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 h-40 flex flex-col justify-center">
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="w-48 h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 h-40 flex flex-col justify-center">
            <div className="w-24 h-4 bg-slate-700 rounded mb-4"></div>
            <div className="w-48 h-10 bg-slate-700 rounded"></div>
          </div>
          <div className="col-span-2 text-center mt-8 flex flex-col items-center justify-center text-slate-400">
            <FileText size={64} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Select a date range and click "Generate Statement"</p>
            <p className="text-sm">Your exact financial breakdown will appear here.</p>
          </div>
        </div>
      )}

      {/* ACTUAL DATA */}
      {data && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6 relative overflow-hidden group hover:shadow-md transition">
              <div className="p-5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl"><DollarSign size={32} /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-4xl font-black text-slate-800 dark:text-white mt-1">{fmtPKR(data.revenue)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6 relative overflow-hidden group hover:shadow-md transition">
              <div className="p-5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl"><TrendingDown size={32} /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Cost of Goods (COGS)</p>
                <p className="text-4xl font-black text-slate-800 dark:text-white mt-1">{fmtPKR(data.cogs)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6 relative overflow-hidden group hover:shadow-md transition">
              <div className="p-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl"><TrendingDown size={32} /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Operating Expenses</p>
                <p className="text-4xl font-black text-slate-800 dark:text-white mt-1">{fmtPKR(data.expenses)}</p>
              </div>
            </div>
            <div className={`rounded-2xl p-8 shadow-xl flex items-center gap-6 relative overflow-hidden transition ${data.netProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              <div className="p-5 bg-white/20 rounded-2xl"><Calculator size={32} /></div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide opacity-80">Net Profit / (Loss)</p>
                <p className="text-4xl font-black mt-1">{fmtPKR(data.netProfit)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}