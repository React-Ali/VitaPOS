import { useEffect, useState } from 'react'
import { ipc, fmtPKR } from '../lib/ipc'
import { TrendingUp, TrendingDown, Package, AlertTriangle, ShieldAlert, Users, Activity, RotateCcw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    ipc.dashboard.stats().then(data => {
      setStats(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading) return <div className="animate-pulse text-slate-400 p-8">Loading analytics...</div>
  if (!stats) return <div className="text-red-500 p-8">Failed to load dashboard data.</div>

  const isLoss = stats.salesToday.amount < 0;

  const cards = [
    { 
      title: "Today's Net Revenue", 
      value: fmtPKR(stats.salesToday.amount), 
      sub: `${stats.salesToday.count} sales · ${fmtPKR(stats.refundsToday)} refunds`, 
      icon: isLoss ? TrendingDown : TrendingUp, 
      color: isLoss ? "bg-red-500" : "bg-emerald-500", 
      text: isLoss ? "text-red-500" : "text-emerald-500" 
    },
    { title: 'Total Customers', value: stats.totalCustomers, sub: 'Registered profiles', icon: Users, color: "bg-blue-500", text: "text-blue-500" },
    { title: 'Low Stock Alerts', value: stats.lowStock, sub: 'Items running out', icon: AlertTriangle, color: "bg-amber-500", text: "text-amber-500" },
    { title: 'Expiring Soon', value: stats.expiringSoon, sub: 'Within 90 days', icon: ShieldAlert, color: "bg-red-500", text: "text-red-500" }
  ]

  const chartData = stats.salesTrend.map((item: any) => {
    const dateObj = new Date(item.date)
    return {
      ...item,
      displayDate: dateObj.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-sm">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-emerald-400 font-black">{fmtPKR(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Pharmacy Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Here is what is happening at your store today.</p>
        </div>
        <div className="text-sm font-medium text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition"><c.icon size={80} className={c.text} /></div>
            <div className="z-10">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{c.title}</p>
              <p className={`text-3xl font-extrabold mt-2 ${isLoss && i === 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{c.value}</p>
              <p className="text-xs text-slate-400 mt-2">{c.sub}</p>
            </div>
            <div className={`${c.color} p-3 rounded-xl text-white shadow-lg z-10`}>
              <c.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Activity size={20} className="text-emerald-500"/> Gross Sales Trend (Last 7 Days)</h3>
          </div>
          
          <div className="flex-1 w-full h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No sales recorded in the last 7 days.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white"><TrendingUp size={20} className="text-blue-500"/> Top Selling Products</h3>
          <div className="space-y-4">
            {stats.topSelling.length === 0 && <p className="text-slate-400 text-sm">No sales data yet. Process a sale in the POS to see analytics.</p>}
            {stats.topSelling.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">#{i+1}</div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{m.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">{m.total_qty} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}