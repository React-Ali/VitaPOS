import { useEffect, useState } from 'react'
import { ipc } from '../lib/ipc'
import { Save, Moon, Sun, HardDriveDownload, Building2, Receipt, Monitor, AlertTriangle, Palette, Check, HeartPulse } from 'lucide-react'
import { useUI } from '../store/ui.store'

export default function Settings() {
  const { theme, toggleTheme, themeColor, setThemeColor } = useUI()
  const [settings, setSettings] = useState<any>({})
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Self Heal State
  const [healing, setHealing] = useState(false)
  const [healStatus, setHealStatus] = useState<string[]>([])

  useEffect(() => {
    ipc.settings.get().then(setSettings).catch(console.error)
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value })
    setSaved(false)
  }

  const saveSettings = async () => {
    for (const [key, value] of Object.entries(settings)) {
      await ipc.settings.update(key, value as string)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const triggerBackup = async () => {
    const success = await ipc.system.backup()
    if (success) alert('Backup saved successfully!')
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
    }
  }

  const colors = [
    { name: 'emerald', label: 'Emerald (Default)', bg: 'bg-emerald-500' },
    { name: 'blue', label: 'Ocean Blue', bg: 'bg-blue-500' },
    { name: 'purple', label: 'Amethyst', bg: 'bg-purple-500' },
    { name: 'rose', label: 'Rose Gold', bg: 'bg-rose-500' },
    { name: 'orange', label: 'Sunset', bg: 'bg-orange-500' },
  ] as const

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">System Settings</h1>
      
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex flex-col gap-1">
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <Building2 size={18} /> Business Profile
            </button>
            <button onClick={() => setActiveTab('receipt')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'receipt' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <Receipt size={18} /> Receipt Settings
            </button>
            <button onClick={() => setActiveTab('appearance')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'appearance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <Monitor size={18} /> Appearance
            </button>
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'inventory' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <AlertTriangle size={18} /> Inventory Rules
            </button>
            <button onClick={() => setActiveTab('system')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'system' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <HardDriveDownload size={18} /> Data & Backup
            </button>
            <button onClick={() => setActiveTab('maintenance')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'maintenance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <HeartPulse size={18} /> System Self-Heal
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 min-h-[400px]">
          
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Business Information</h2>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop Name</label>
                <input value={settings.shop_name || ''} onChange={e => handleChange('shop_name', e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone Number</label>
                <input value={settings.shop_phone || ''} onChange={e => handleChange('shop_phone', e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Address</label>
                <textarea rows={3} value={settings.shop_address || ''} onChange={e => handleChange('shop_address', e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button onClick={saveSettings} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition">
                <Save size={18} /> {saved ? 'Saved!' : 'Save Information'}
              </button>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Receipt Settings</h2>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Receipt Footer Message</label>
                <textarea rows={3} value={settings.receipt_footer || ''} onChange={e => handleChange('receipt_footer', e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button onClick={saveSettings} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition">
                <Save size={18} /> {saved ? 'Saved!' : 'Save Receipt Settings'}
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-8 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Appearance</h2>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Dark Mode</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes.</p>
                </div>
                <button onClick={toggleTheme} className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition border border-slate-200 dark:border-slate-600">
                  {theme === 'dark' ? <Sun size={24} className="text-amber-400" /> : <Moon size={24} className="text-slate-700" />}
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Palette size={16}/> Theme Color</h3>
                <div className="grid grid-cols-2 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setThemeColor(color.name)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${themeColor === color.name ? 'border-slate-800 dark:border-white shadow-md bg-slate-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                    >
                      <div className={`w-6 h-6 rounded-full ${color.bg}`}></div>
                      <span className="font-medium text-sm">{color.label}</span>
                      {themeColor === color.name && <Check size={16} className="ml-auto text-slate-800 dark:text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Inventory Rules</h2>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Low Stock Alert Threshold</label>
                <p className="text-xs text-slate-500 mb-2">Show a red alert when total stock falls below this number.</p>
                <input type="number" value={settings.low_stock_threshold || 10} onChange={e => handleChange('low_stock_threshold', e.target.value)} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button onClick={saveSettings} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition">
                <Save size={18} /> {saved ? 'Saved!' : 'Save Rules'}
              </button>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Data & Backup</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manually trigger a database backup. A copy is also saved to your Documents folder automatically when the app closes.</p>
              <button onClick={triggerBackup} className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-900 dark:hover:bg-slate-600 transition w-full justify-center">
                <HardDriveDownload size={18} /> Download Backup to Device
              </button>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">System Self-Heal</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">This scans the database for negative stock, orphaned records, and corruption. It safely repairs any issues found and optimizes the database for speed.</p>
              
              {healStatus.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-60 overflow-y-auto">
                  {healStatus.map((msg, i) => (
                    <p key={i} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-start gap-2">
                      <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" /> {msg}
                    </p>
                  ))}
                </div>
              )}

              <button onClick={runSelfHeal} disabled={healing} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition w-full justify-center disabled:opacity-50">
                <HeartPulse size={18} /> {healing ? 'Healing Database...' : 'Run Diagnostics & Heal'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}