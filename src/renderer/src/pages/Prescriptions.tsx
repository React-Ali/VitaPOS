import { useEffect, useState } from 'react'
import { ipc } from '../lib/ipc'
import { ShieldAlert, FileText } from 'lucide-react'

export default function Prescriptions() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    ipc.doctor.prescriptions().then(setLogs).catch(console.error)
  }, [])

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Prescription Register</h1>
          <p className="text-sm text-slate-500">Legal log of all Schedule G & D controlled substance sales.</p>
        </div>
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 flex items-center gap-2 font-medium text-sm">
          <ShieldAlert size={18} /> DRAP Compliance Log
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Invoice No</th>
              <th className="px-6 py-4">Medicine</th>
              <th className="px-6 py-4">Patient CNIC</th>
              <th className="px-6 py-4">Prescribing Doctor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 text-slate-500">{log.created_at.slice(0, 16)}</td>
                <td className="px-6 py-4 font-mono font-medium">{log.invoice_no}</td>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-500"/> {log.medicine_name}
                </td>
                <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{log.customer_cnic}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800 dark:text-white">{log.doctor_name || 'N/A'}</p>
                  <p className="text-xs text-slate-500 font-mono">PMDC: {log.pmdc_no || 'N/A'}</p>
                </td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No controlled medicines have been sold yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}