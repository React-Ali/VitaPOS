import { useState, useEffect, useRef } from 'react'
import { ipc } from '../lib/ipc'
import { useAuth } from '../store/auth.store'
import { Activity, ShieldCheck, Wifi, Server, KeyRound, X, CheckCircle, AlertTriangle } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setSession = useAuth((s) => s.setSession)

  // Modals State
  const [showNetwork, setShowNetwork] = useState(false)
  const [showReset, setShowReset] = useState(false)
  
  // Network State
  const [netConfig, setNetConfig] = useState({ mode: 'master', masterIp: '192.168.1.100' })
  const [testResult, setTestResult] = useState<any>(null)
  const [netSuccess, setNetSuccess] = useState(false) // NEW: Success state
  
  // Reset State
  const [resetForm, setResetForm] = useState({ username: '', newPassword: '', key: '' })
  const [resetError, setResetError] = useState('')
  
  const usernameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus()
    }

    const loadNetwork = async () => {
      try {
        if (window.api?.network?.get) {
          const config = await ipc.network.get()
          setNetConfig(config)
        }
      } catch (err) {
        console.error('Failed to load network config:', err)
      }
    }
    loadNetwork()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await ipc.auth.login(username, password)
      setSession(res.user, res.token)
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.')
      usernameInputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const saveNetwork = async () => {
    try {
      await ipc.network.set(netConfig)
      setNetSuccess(true)
      // Instead of an alert, show a nice message and auto-close after 2 seconds
      setTimeout(() => {
        setShowNetwork(false)
        setNetSuccess(false)
      }, 2500)
    } catch (err) {
      alert('Failed to save network settings.')
    }
  }

  const testNetwork = async () => {
    setTestResult({ message: 'Testing connection...', success: true })
    try {
      const res = await ipc.network.test()
      setTestResult(res)
    } catch (err: any) {
      setTestResult({ message: err.message, success: false })
    }
  }

  const handleReset = async () => {
    setResetError('')
    if (!resetForm.username || !resetForm.newPassword || !resetForm.key) {
      return setResetError('Please fill all fields.')
    }
    try {
      await ipc.auth.reset(resetForm.username, resetForm.newPassword, resetForm.key)
      alert('Password reset successful! You can now log in.')
      setShowReset(false)
      setResetForm({ username: '', newPassword: '', key: '' })
    } catch (err: any) {
      setResetError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Network Settings Modal */}
      {showNetwork && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[400px] shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Server size={20}/> Network Setup</h3>
              <button onClick={() => setShowNetwork(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20}/></button>
            </div>

            {netSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle size={64} className="text-emerald-500 mb-4 animate-bounce" />
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Settings Saved!</h4>
                <p className="text-sm text-slate-500">Please try logging in now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Computer Mode</label>
                  <select value={netConfig.mode} onChange={e => setNetConfig({...netConfig, mode: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none text-slate-800 dark:text-white">
                    <option value="master">Master (Main Database)</option>
                    <option value="client">Client (Connect to Master)</option>
                  </select>
                </div>
                
                {netConfig.mode === 'client' && (
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Master PC IP Address</label>
                    <input value={netConfig.masterIp} onChange={e => setNetConfig({...netConfig, masterIp: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none text-slate-800 dark:text-white" placeholder="e.g. 192.168.1.15" />
                  </div>
                )}

                {testResult && (
                  <div className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {testResult.success ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                    {testResult.message}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {netConfig.mode === 'client' && (
                    <button onClick={testNetwork} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition">Test Connection</button>
                  )}
                  <button onClick={saveNetwork} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition shadow-md">Save Settings</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[400px] shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><KeyRound size={20}/> Reset Password</h3>
              <button onClick={() => setShowReset(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={20}/></button>
            </div>
            
            {resetError && <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-lg text-sm font-bold">{resetError}</div>}

            <div className="space-y-4">
              <input placeholder="Username (e.g. admin)" value={resetForm.username} onChange={e => setResetForm({...resetForm, username: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none text-slate-800 dark:text-white" />
              <input type="password" placeholder="New Password" value={resetForm.newPassword} onChange={e => setResetForm({...resetForm, newPassword: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none text-slate-800 dark:text-white" />
              <input placeholder="Recovery Code" value={resetForm.key} onChange={e => setResetForm({...resetForm, key: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 outline-none text-slate-800 dark:text-white" />
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>For Cashiers/Pharmacists:</strong> Ask your Admin to generate a 6-digit Recovery Code from the Users page.<br/><br/>
                  <strong>For Admins:</strong> Use your unique Master Recovery Key (found in Settings).
                </p>
              </div>
              
              <button onClick={handleReset} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition shadow-md">Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={submit} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Activity size={40} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">VitaPOS</h1>
          <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" /> Secure Access Portal
          </p>
        </div>
        
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 mb-6 rounded-xl text-sm font-bold text-center border border-red-100 dark:border-red-900">{error}</div>}
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
            <input 
              ref={usernameInputRef}
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter your username" 
              className="w-full border-2 border-slate-200 dark:border-slate-600 bg-transparent rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full border-2 border-slate-200 dark:border-slate-600 bg-transparent rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium" 
              required 
            />
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="w-full mt-8 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30">
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <div className="flex justify-between mt-6 text-sm font-bold">
          <button type="button" onClick={() => { setShowReset(true); setResetError(''); }} className="text-slate-500 hover:text-emerald-600 transition">Forgot Password?</button>
          <button type="button" onClick={() => setShowNetwork(true)} className="text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition"><Wifi size={14}/> Network Setup</button>
        </div>
      </form>
    </div>
  )
}