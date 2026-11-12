import { useState } from 'react'
import { ipc } from '../lib/ipc'
import { useAuth } from '../store/auth.store'
import { Activity, ShieldCheck } from 'lucide-react'

export default function Login() {
  // SECURITY FIX: Empty by default!
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setSession = useAuth((s) => s.setSession)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await ipc.auth.login(username, password)
      setSession(res.user, res.token)
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl"></div>

      <form onSubmit={submit} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 relative z-10">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Activity size={40} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight text-center">VitaPOS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" /> Secure Access Portal
          </p>
        </div>
        
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 mb-6 rounded-xl text-sm font-bold text-center border border-red-100 dark:border-red-900/50">{error}</div>}
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
            <input
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
        
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}