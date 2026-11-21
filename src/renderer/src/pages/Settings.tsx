import { useEffect, useState } from 'react'
import { ipc } from '../lib/ipc'
import { 
  Save, Moon, Sun, HardDriveDownload, Building2, Receipt, Monitor, 
  AlertTriangle, Palette, Check, HeartPulse, Trash2, Server, Copy, RefreshCw
} from 'lucide-react'
import { useUI } from '../store/ui.store'

export default function Settings() {
  const { theme, toggleTheme, themeColor, setThemeColor } = useUI()
  const [settings, setSettings] = useState<any>({})
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const [healing, setHealing] = useState(false)
  const [healStatus, setHealStatus] = useState<string[]>([])
  
  const [netConfig, setNetConfig] = useState({ mode: 'master', masterIp: '192.168.1.100' })
  const [testingConn, setTestingConn] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null)
  
  const [showRestartModal, setShowRestartModal] = useState(false)

  useEffect(() => {
    ipc.settings.get().then(setSettings).catch(console.error)
    ipc.network.get().then(setNetConfig).catch(console.error)
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

  const saveNetwork = async () => {
    await ipc.network.set(netConfig)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setShowRestartModal(true)
  }

  const testConnection = async () => {
    setTestingConn(true)
    setTestResult(null)
    const res = await ipc.network.test()
    setTestResult(res)
    setTestingConn(false)
  }

  const triggerBackup = async () => {
    const success = await ipc.system.backup()
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
      
      {showRestartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[450px] shadow-2xl text-center border-t-8 border-emerald-500">
            <RefreshCw size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Restart Required</h3>
            <p className="text-sm text-slate-500 mb-6">Network settings have been saved. The application must restart to apply the changes.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRestartModal(false)} className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300">Later</button>
              <button onClick={() => ipc.app.relaunch()} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2">
                <RefreshCw size={16}/> Restart Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex flex-col gap-1">
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Building2 size={18} /> Business Profile</button>
            <button onClick={() => setActiveTab('receipt')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'receipt' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Receipt size={18} /> Receipt & Hardware</button>
            <button onClick={() => setActiveTab('appearance')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'appearance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Monitor size={18} /> Appearance</button>
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'inventory' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><AlertTriangle size={18} /> Inventory Rules</button>
            <button onClick={() => setActiveTab('network')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'network' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><Server size={18} /> Network / LAN</button>
            <button onClick={() => setActiveTab('system')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'system' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><HeartPulse size={18} /> System & Security</button>
            <button onClick={() => setActiveTab('danger')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'danger' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}><Trash2 size={18} /> Danger Zone</button>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Business Information</h2>
              <div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop Name</label><input value={settings.shop_name || ''} onChange={e => handleChange('shop_name', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone Number</label><input value={settings.shop_phone || ''} onChange={e => handleChange('shop_phone', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Address</label><textarea rows={3} value={settings.shop_address || ''} onChange={e => handleChange('shop_address', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <button onClick={saveSettings} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition"><Save size={18} /> {saved ? 'Saved!' : 'Save Information'}</button>
            </div>
          )}
          {activeTab === 'receipt' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Receipt & Hardware</h2>
              <div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Receipt Footer Message</label><textarea rows={3} value={settings.receipt_footer || ''} onChange={e => handleChange('receipt_footer', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Thermal Printer Size</label><select value={settings.printer_size || '80mm'} onChange={e => handleChange('printer_size', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500"><option value="80mm">80mm (Standard Thermal)</option><option value="58mm">58mm (Small Thermal)</option><option value="A4">A4 Paper (Standard)</option></select></div>
              <button onClick={saveSettings} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition"><Save size={18} /> {saved ? 'Saved!' : 'Save Receipt Settings'}</button>
            </div>
          )}
          {activeTab === 'appearance' && (
            <div className="space-y-8 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Appearance</h2>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700"><div><p className="font-bold text-slate-800 dark:text-slate-200">Dark Mode</p><p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes.</p></div><button onClick={toggleTheme} className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition border border-slate-200 dark:border-slate-600">{theme === 'dark' ? <Sun size={24} className="text-amber-400" /> : <Moon size={24} className="text-slate-700" />}</button></div>
              <div><h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Palette size={16}/> Theme Color</h3><div className="grid grid-cols-2 gap-3">{colors.map((color) => (<button key={color.name} onClick={() => setThemeColor(color.name)} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${themeColor === color.name ? 'border-slate-800 dark:border-white shadow-md bg-slate-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}><div className={`w-6 h-6 rounded-full ${color.bg}`}></div><span className="font-medium text-sm text-slate-800 dark:text-white">{color.label}</span>{themeColor === color.name && <Check size={16} className="ml-auto text-slate-800 dark:text-white" />}</button>))}</div></div>
            </div>
          )}
          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Inventory Rules</h2>
              <div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Low Stock Alert Threshold</label><p className="text-xs text-slate-500 mb-2">Show a red alert when total stock falls below this number.</p><input type="number" value={settings.low_stock_threshold || 10} onChange={e => handleChange('low_stock_threshold', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <button onClick={saveSettings} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition"><Save size={18} /> {saved ? 'Saved!' : 'Save Rules'}</button>
            </div>
          )}
          {activeTab === 'network' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">LAN Synchronization</h2>
              <p className="text-sm text-slate-500">Connect multiple computers over Wi-Fi to share one database.</p>
              <div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Computer Mode</label><select value={netConfig.mode} onChange={e => setNetConfig({...netConfig, mode: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500"><option value="master">Master (Main Computer with Database)</option><option value="client">Client (Secondary Computer)</option></select></div>
              {netConfig.mode === 'client' && (<div><label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Master PC IP Address</label><input value={netConfig.masterIp} onChange={e => setNetConfig({...netConfig, masterIp: e.target.value})} placeholder="e.g. 192.168.1.15" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500" /><p className="text-xs text-slate-500 mt-1">Enter the IPv4 address of the Master PC on your Wi-Fi router.</p></div>)}
              <div className="flex gap-2 pt-2"><button onClick={saveNetwork} className="flex-1 bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 transition"><Save size={18} /> {saved ? 'Saved!' : 'Save Network Settings'}</button></div>
              {netConfig.mode === 'client' && (<div className="pt-4 border-t border-slate-200 dark:border-slate-700"><button onClick={testConnection} disabled={testingConn} className="w-full bg-slate-800 dark:bg-slate-700 text-white py-2 rounded-lg font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2 disabled:opacity-50">{testingConn ? 'Pinging Master...' : 'Test Connection'}</button>{testResult && (<div className={`mt-3 p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{testResult.success ? <Check size={16}/> : <AlertTriangle size={16}/>}{testResult.message}</div>)}</div>)}
            </div>
          )}
          {activeTab === 'system' && (
            <div className="space-y-8 max-w-md">
              <div><h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Data & Security</h2><p className="text-sm text-slate-500 mb-4">Backup your database or run diagnostics.</p><button onClick={triggerBackup} className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-900 w-full justify-center mb-4"><HardDriveDownload size={18} /> {saved ? 'Backup Saved!' : 'Download Backup to Device'}</button>{healStatus.length > 0 && (<div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-4 border border-slate-200 dark:border-slate-700">{healStatus.map((msg, i) => (<p key={i} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><Check size={16} className="text-emerald-500" /> {msg}</p>))}</div>)}<button onClick={runSelfHeal} disabled={healing} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 w-full justify-center disabled:opacity-50"><HeartPulse size={18} /> {healing ? 'Healing Database...' : 'Run Diagnostics & Heal'}</button></div>
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700"><h3 className="text-lg font-bold text-red-600 mb-2">Master Recovery Key</h3><p className="text-sm text-slate-500 mb-3">Write this key down and keep it in a safe place. If you ever forget the Admin password, you will need this exact key to reset it. <b>It is unique to your pharmacy.</b></p><div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between"><span className="text-xl font-mono font-black tracking-widest text-slate-800 dark:text-white">{settings.master_recovery_key || 'Generating...'}</span><button onClick={() => copyToClipboard(settings.master_recovery_key)} className="text-blue-500 font-bold text-sm hover:text-blue-700 flex items-center gap-1"><Copy size={16}/> {saved ? 'Copied!' : 'Copy'}</button></div></div>
            </div>
          )}
          {activeTab === 'danger' && (
            <div className="space-y-6 max-w-md"><h2 className="text-lg font-bold text-red-600 border-b border-red-200 dark:border-red-900 pb-2">Danger Zone</h2><p className="text-sm text-slate-500">These actions are irreversible. Please be careful.</p><button onClick={() => { if(window.confirm('WARNING: This will permanently delete ALL sales, medicines, and settings. Are you absolutely sure?')) { setHealStatus(['Factory reset feature coming in v1.1.0.']); } }} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 w-full justify-center"><Trash2 size={18} /> Factory Reset Software</button></div>
          )}
        </div>
      </div>
    </div>
  )
}