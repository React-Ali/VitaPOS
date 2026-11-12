import { useEffect, useState } from 'react'
import { ipc } from '../lib/ipc'
import { UserPlus, Stethoscope, Edit2, Trash2 } from 'lucide-react'

export default function Doctors() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  
  const [form, setForm] = useState({ name: '', pmdc_no: '', hospital: '', phone: '', specialty: '', email: '', notes: '' })

  const load = () => {
    if (window.api?.doctor?.list) ipc.doctor.list().then(setDoctors).catch(console.error)
  }
  
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ name: '', pmdc_no: '', hospital: '', phone: '', specialty: '', email: '', notes: '' }); setEditId(null); setShowModal(true) }
  const openEdit = (d: any) => { setForm({ ...d }); setEditId(d.id); setShowModal(true) }

  const save = async () => {
    if (!form.name) return alert('Doctor name is required')
    try {
      if (editId) await ipc.doctor.update(editId, form)
      else await ipc.doctor.create(form)
      setShowModal(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => {
    if (confirm('Delete this doctor?')) {
      await ipc.doctor.delete(id)
      load()
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Doctor Directory</h1>
          <p className="text-sm text-slate-500">Manage prescribers and PMDC details.</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition">
          <UserPlus size={18} /> Add Doctor
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Doctor Name</th>
              <th className="px-6 py-4">Specialty</th>
              <th className="px-6 py-4">PMDC No.</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {doctors.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 font-bold flex items-center gap-2"><Stethoscope size={16} className="text-emerald-500"/> {d.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{d.specialty || '—'}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{d.pmdc_no || '—'}</td>
                <td className="px-6 py-4 text-slate-500">{d.phone || '—'}</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => openEdit(d)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => del(d.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No doctors added yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-[500px] shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{editId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Doctor Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-lg px-4 py-2 col-span-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              <input placeholder="Specialty (e.g. Cardiologist)" value={form.specialty || ''} onChange={e => setForm({...form, specialty: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="PMDC Number" value={form.pmdc_no || ''} onChange={e => setForm({...form, pmdc_no: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Hospital / Clinic" value={form.hospital || ''} onChange={e => setForm({...form, hospital: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Phone Number" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Email Address" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-4 py-2 col-span-2 outline-none" />
              <textarea placeholder="Notes / Extra Details" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full border rounded-lg px-4 py-2 col-span-2 outline-none" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg font-medium bg-slate-200 dark:bg-slate-700">Cancel</button>
              <button onClick={save} className="flex-1 py-2 rounded-lg font-medium text-white bg-emerald-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}