import { useEffect, useState } from 'react'
import { ipc, formatDateTime } from '../lib/ipc'
import { downloadCSV } from '../lib/export'
import { ShieldCheck, FileDown } from 'lucide-react'

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    ipc.audit.logs().then(setLogs).catch(console.error)
  }, [])

  const exportData = () => {
    const headers = ['Date', 'User', 'Action', 'Entity', 'Details']
    const rows = logs.map(l => [formatDateTime(l.created_at), l.full_name || 'System', l.action, l.entity || '', l.details || ''])
    downloadCSV('Audit_Logs.csv', headers, rows)
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">System Audit Logs</h1>
          <p className="text-sm text-slate-500">Track employee activity, logins, and data changes.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg border border-emerald-200 flex items-center gap-2 font-medium text-sm">
            <ShieldCheck size={18} /> Admin Security
          </div>
          <button onClick={exportData} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 transition shadow-sm">
            <FileDown size={18} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Entity</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 text-slate-500">{formatDateTime(log.created_at)}</td>
                <td className="px-6 py-4 font-bold">{log.full_name || 'System'}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 capitalize">{log.entity || '—'}</td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400 max-w-xs truncate" title={log.details}>
                  {log.details || '—'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No activity logs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}