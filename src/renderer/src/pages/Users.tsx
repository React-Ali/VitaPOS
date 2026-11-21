import { useEffect, useState } from 'react'
import { ipc } from '../lib/ipc'
import { useAuth } from '../store/auth.store'
import { UserPlus, Edit2, ShieldAlert, Trash2, AlertTriangle, X, KeyRound, Copy, CheckCircle } from 'lucide-react'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'cashier' })
  
  // Custom Error/Success States
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<any | null>(null)
  
  const [recoveryModal, setRecoveryModal] = useState<{ name: string, code: string } | null>(null)

  const load = () => ipc.user.list().then(setUsers).catch(console.error)
  useEffect(() => { load() }, [])

  const openEdit = (u: any) => {
    setForm({ username: u.username, password: '', full_name: u.full_name, role: u.role })
    setEditId(u.id)
    setErrorMsg('')
    setShowModal(true)
  }

  const openAdd = () => {
    setForm({ username: '', password: '', full_name: '', role: 'cashier' })
    setEditId(null)
    setErrorMsg('')
    setShowModal(true)
  }

  const save = async () => {
    if (!form.full_name || !form.username) return setErrorMsg('Name and Username required')
    if (!editId && !form.password) return setErrorMsg('Password required for new user')
    
    setErrorMsg('')
    try {
      if (editId) await ipc.user.update(editId, form)
      else await ipc.user.create(form)
      setShowModal(false)
      setSuccessMsg('User saved successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
      load()
    } catch (e: any) { setErrorMsg(e.message) }
  }

  const executeDelete = async () => {
    if (!confirmDeleteUser) return
    setDeleteError('')
    try {
      await ipc.user.delete(confirmDeleteUser.id)
      setConfirmDeleteUser(null)
      load()
    } catch (e: any) {
      setDeleteError(e.message)
    }
  }

  const generateCode = async (u: any) => {
    try {
      const code = await ipc.auth.generateCode(u.username)
      setRecoveryModal({ name: u.full_name, code })
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div>
      {successMsg && (
        <div className="fixed top-20 right-8 bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-xl shadow-lg z-[100] flex items-center gap-2 font-bold animate-in slide-in-from-top-4">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Staff & Users</h1>
          <p className="text-sm text-slate-500">Manage system access and roles.</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                  {u.full_name} {u.id === currentUser?.id && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-1">YOU</span>}
                </td>
                <td className="px-6 py-4 font-mono text-slate-500">{u.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                    u.role === 'pharmacist' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>{u.role.toUpperCase()}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => generateCode(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Generate Recovery Code"><KeyRound size={16}/></button>
                  <button onClick={() => openEdit(u)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit User"><Edit2 size={16}/></button>
                  <button onClick={() => ipc.user.toggle(u.id, !u.is_active).then(load)} className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition" title={u.is_active ? "Deactivate" : "Activate"}><ShieldAlert size={16}/></button>
                  
                  {u.id !== currentUser?.id && (
                    <button onClick={() => { setConfirmDeleteUser(u); setDeleteError(''); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete User"><Trash2 size={16}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECOVERY CODE MODAL */}
      {recoveryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[400px] shadow-2xl text-center border-t-8 border-blue-500">
            <KeyRound size={48} className="text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Recovery Code Generated</h3>
            <p className="text-sm text-slate-500 mb-6">Give this code to <b>{recoveryModal.name}</b>. It expires in 15 minutes.</p>
            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl flex items-center justify-between mb-6 border border-slate-200 dark:border-slate-700">
              <span className="text-3xl font-black tracking-widest text-slate-800 dark:text-white">{recoveryModal.code}</span>
              <button onClick={() => { navigator.clipboard.writeText(recoveryModal.code); setSuccessMsg('Code Copied!'); setTimeout(() => setSuccessMsg(''), 2000); }} className="text-blue-500 hover:text-blue-700 p-2"><Copy size={20}/></button>
            </div>
            <button onClick={() => setRecoveryModal(null)} className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900">Done</button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[400px] shadow-2xl text-center border-t-8 border-red-500">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete User?</h3>
            
            {deleteError ? (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6 font-medium">{deleteError}</p>
            ) : (
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to permanently delete <b>{confirmDeleteUser.full_name}</b>? If they have sales history, this will fail.</p>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteUser(null)} className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300">
                {deleteError ? 'Close' : 'Cancel'}
              </button>
              {!deleteError && <button onClick={executeDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md">Delete</button>}
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
            </div>
            
            {errorMsg && <div className="bg-red-50 text-red-600 p-3 text-sm font-bold border border-red-100 rounded-lg mb-4 flex items-center gap-2"><AlertTriangle size={16}/> {errorMsg}</div>}

            <div className="space-y-4">
              <input placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              <input placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              <input type="password" placeholder={editId ? "New Password (leave blank to keep current)" : "Password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-transparent rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 outline-none">
                <option value="cashier">Cashier (POS Only)</option>
                <option value="pharmacist">Pharmacist (Inventory)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg font-bold bg-slate-200 dark:bg-slate-700">Cancel</button>
              <button onClick={save} className="flex-1 py-2 rounded-lg font-bold text-white bg-emerald-600 shadow-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}