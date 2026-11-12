import { useState } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { downloadCSV } from '../lib/export'
import { BarChart3, Search, TrendingUp, DollarSign, FileDown, Calculator } from 'lucide-react'

export default function Reports() {
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [activeTab, setActiveTab] = useState<'sales' | 'profit'>('sales')
  
  const [salesData, setSalesData] = useState<any>(null)
  const [profitData, setProfitData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      if (activeTab === 'sales') {
        setSalesData(await ipc.report.sales(startDate, endDate))
      } else {
        setProfitData(await ipc.report.profit(startDate, endDate))
      }
    } catch (err) {
      console.error(err)
      alert("Failed to load report data")
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'sales' | 'profit') => {
    setActiveTab(tab)
    if (tab === 'sales') setProfitData(null)
    else setSalesData(null)
  }

  const exportCurrentReport = () => {
    if (activeTab === 'sales' && salesData) {
      const headers = ['Invoice No', 'Cashier', 'Date', 'Time', 'Amount (PKR)']
      const rows = salesData.sales.map((s: any) => [
        s.invoice_no, s.cashier, s.created_at.slice(0, 10), s.created_at.slice(11, 16), s.total.toFixed(2)
      ])
      downloadCSV(`Sales_Report_${startDate}_to_${endDate}.csv`, headers, rows)
    } else if (activeTab === 'profit' && profitData) {
      const headers = ['Medicine', 'Qty Sold', 'Revenue (PKR)', 'Cost (PKR)', 'Profit (PKR)']
      const rows = profitData.profitData.map((p: any) => [
        p.name, p.qty_sold, p.total_revenue.toFixed(2), p.total_cost.toFixed(2), p.total_profit.toFixed(2)
      ])
      downloadCSV(`Profit_Report_${startDate}_to_${endDate}.csv`, headers, rows)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Generate sales summaries and profit margins for any date range.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
        </div>
        <button onClick={generateReport} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 h-[50px]">
          <Search size={20} /> {loading ? 'Generating...' : 'Generate Report'}
        </button>
        <button onClick={exportCurrentReport} disabled={(!salesData && activeTab === 'sales') || (!profitData && activeTab === 'profit')} className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 dark:hover:bg-slate-600 transition disabled:opacity-50 h-[50px]">
          <FileDown size={20} /> Export Excel
        </button>
      </div>

      <div className="flex gap-2 mb-6 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-fit">
        <button onClick={() => handleTabChange('sales')} className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${activeTab === 'sales' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>
          <BarChart3 size={18}/> Sales Summary
        </button>
        <button onClick={() => handleTabChange('profit')} className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${activeTab === 'profit' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>
          <TrendingUp size={18}/> Profit Analysis
        </button>
      </div>

      {activeTab === 'sales' && salesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl"><BarChart3 size={32} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{fmtPKR(salesData.summary.total_amount)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><Calculator size={32} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Transactions</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{salesData.summary.total_tx}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
                <tr><th className="px-6 py-4">Invoice No</th><th className="px-6 py-4">Cashier</th><th className="px-6 py-4">Date & Time</th><th className="px-6 py-4 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {salesData.sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">{s.invoice_no}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{s.cashier}</td>
                    <td className="px-6 py-4 text-slate-500">{s.created_at.slice(0, 16)}</td>
                    <td className="px-6 py-4 text-right font-bold">{fmtPKR(s.total)}</td>
                  </tr>
                ))}
                {salesData.sales.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No sales found for this date range.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'profit' && profitData && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl"><DollarSign size={32} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{fmtPKR(profitData.overallSummary.total_revenue || 0)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-xl"><DollarSign size={32} /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Cost</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{fmtPKR(profitData.overallSummary.total_cost || 0)}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 shadow-lg flex items-center gap-4">
              <div className="p-4 bg-emerald-500 text-white rounded-xl"><TrendingUp size={32} /></div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Net Profit</p>
                <p className="text-2xl font-black text-white">{fmtPKR(profitData.overallSummary.total_profit || 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h3 className="font-bold text-slate-700 dark:text-slate-300">Profit Breakdown by Medicine</h3></div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
                <tr><th className="px-6 py-4">Medicine</th><th className="px-6 py-4 text-center">Qty Sold</th><th className="px-6 py-4 text-right">Revenue</th><th className="px-6 py-4 text-right">Cost</th><th className="px-6 py-4 text-right">Profit</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {profitData.profitData.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{p.name}</td>
                    <td className="px-6 py-4 text-center font-medium">{p.qty_sold}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{fmtPKR(p.total_revenue)}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{fmtPKR(p.total_cost)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmtPKR(p.total_profit)}</td>
                  </tr>
                ))}
                {profitData.profitData.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No profit data found for this date range.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {((activeTab === 'sales' && !salesData) || (activeTab === 'profit' && !profitData)) && !loading && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
          <BarChart3 size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1">No Data Loaded</h3>
          <p className="text-sm text-slate-500">Select a date range and click "Generate Report" to view analytics.</p>
        </div>
      )}
    </div>
  )
}