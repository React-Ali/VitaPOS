import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, ShoppingCart, Pill, LogOut, Users, BarChart3, Truck, Settings, DollarSign, RotateCcw, Bell, Stethoscope, FileText, ShieldAlert, Calculator, Activity, AlertTriangle, CheckCircle
} from 'lucide-react'
import { useAuth } from '../../store/auth.store'
import { useUI } from '../../store/ui.store'
import { ipc } from '../../lib/ipc'

const ALL_GROUPS = [
  {
    title: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'pharmacist'] },
      { to: '/pos', icon: ShoppingCart, label: 'Point of Sale', roles: ['admin', 'pharmacist', 'cashier'] },
      { to: '/sales-history', icon: FileText, label: 'Sales History', roles: ['admin', 'pharmacist', 'cashier'] },
      { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'pharmacist'] },
      { to: '/pnl', icon: Calculator, label: 'Profit & Loss', roles: ['admin'] },
    ]
  },
  {
    title: 'Inventory',
    items: [
      { to: '/medicines', icon: Pill, label: 'Products', roles: ['admin', 'pharmacist'] },
      { to: '/purchases', icon: Truck, label: 'Purchases', roles: ['admin', 'pharmacist'] },
      { to: '/returns', icon: RotateCcw, label: 'Returns', roles: ['admin', 'pharmacist'] },
      { to: '/inventory', icon: AlertTriangle, label: 'Inventory Alerts', roles: ['admin', 'pharmacist'] },
    ]
  },
  {
    title: 'Clinical',
    items: [
      { to: '/doctors', icon: Stethoscope, label: 'Doctors Directory', roles: ['admin', 'pharmacist'] },
      { to: '/prescriptions', icon: FileText, label: 'Prescription Log', roles: ['admin', 'pharmacist'] },
    ]
  },
  {
    title: 'Management',
    items: [
      { to: '/customers', icon: Users, label: 'Customers & Khata', roles: ['admin', 'pharmacist', 'cashier'] },
      { to: '/expenses', icon: DollarSign, label: 'Expenses', roles: ['admin'] },
    ]
  },
  {
    title: 'System',
    items: [
      { to: '/users', icon: Users, label: 'Staff / Users', roles: ['admin'] },
      { to: '/audit', icon: ShieldAlert, label: 'Audit Logs', roles: ['admin'] },
      { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
    ]
  }
]

export default function AppLayout() {
  const { user, clear } = useAuth()
  const { theme, themeColor } = useUI()
  const nav = useNavigate()

  const [showNotifications, setShowNotifications] = useState(false)
  const [alerts, setAlerts] = useState<{ lowStockItems: any[], expiringItems: any[] }>({ lowStockItems: [], expiringItems: [] })
  const [dismissedCount, setDismissedCount] = useState(0)

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', themeColor)
  }, [theme, themeColor])

  useEffect(() => {
    const loadAlerts = () => {
      if (window.api?.dashboard?.alerts) {
        ipc.dashboard.alerts().then(res => { 
          if (res) {
            setAlerts(res) 
            const total = (res.lowStockItems?.length || 0) + (res.expiringItems?.length || 0)
            
            // Native Windows Notification (Only runs when logged in)
            if (total > 0 && Notification.permission === 'granted') {
              new Notification('VitaPOS Alert', {
                body: `You have ${res.lowStockItems.length} low stock items and ${res.expiringItems.length} expiring items.`,
                icon: 'resources/icon.png'
              })
            }
          } 
        }).catch(console.error)
      }
    }
    
    // Request notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }

    loadAlerts()
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const totalAlerts = (alerts.lowStockItems?.length || 0) + (alerts.expiringItems?.length || 0)
  const hasUnread = totalAlerts > dismissedCount

  const navGroups = ALL_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(user?.role || 'cashier'))
  })).filter(group => group.items.length > 0)

  const handleNotificationClick = (name: string) => {
    nav(`/medicines?search=${encodeURIComponent(name)}`)
    setShowNotifications(false)
  }

  const clearNotifications = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissedCount(totalAlerts)
    setShowNotifications(false)
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors overflow-hidden">
      
      <aside className="w-64 bg-white dark:bg-slate-950 flex flex-col shadow-xl z-30 border-r border-slate-200 dark:border-slate-800 relative">
        <div className="px-6 py-8 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-3">
            <Activity size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white text-center leading-tight">VitaPOS</h1>
          <div className="mt-3 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{user?.role}</p>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          {navGroups.map((group, i) => (
            <div key={i} className="mb-6">
              <p className="px-6 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{group.title}</p>
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-r-4 border-emerald-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`
                }>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
            </div>
          </div>
          
          <button 
            onClick={clear} 
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-50 relative">
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          
          <div className="relative z-50">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative transition">
              <Bell size={20} className="text-slate-600 dark:text-slate-300" />
              {hasUnread && totalAlerts > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  {totalAlerts > 0 && (
                    <button onClick={clearNotifications} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <CheckCircle size={12} /> Mark as Read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {totalAlerts === 0 && <p className="p-4 text-sm text-center text-slate-400">You're all caught up!</p>}
                  
                  {alerts.lowStockItems?.map((item, i) => (
                    <div key={`ls-${i}`} onClick={() => handleNotificationClick(item.name)} className="p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex gap-3 cursor-pointer transition-colors">
                      <div className="text-amber-500 mt-0.5"><Pill size={16}/></div>
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-slate-500">Low Stock: Only {item.qty} remaining</p>
                      </div>
                    </div>
                  ))}

                  {alerts.expiringItems?.map((item, i) => (
                    <div key={`ex-${i}`} onClick={() => handleNotificationClick(item.medicine_name)} className="p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex gap-3 cursor-pointer transition-colors">
                      <div className="text-red-500 mt-0.5"><RotateCcw size={16}/></div>
                      <div>
                        <p className="text-sm font-bold">{item.medicine_name}</p>
                        <p className="text-xs text-slate-500">Batch {item.batch_no} expires on {item.expiry_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto z-10 relative">
          <div className="p-8 max-w-[1600px] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  )
}