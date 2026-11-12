import { useEffect, useState } from 'react'
import { ipc } from '../lib/ipc'

export default function ControlledRegister() {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => { ipc.controlled.list().then(setRows) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Controlled Substance Register</h1>
      <p className="text-sm text-slate-500 mb-4">
        DRAP Schedule G/D sales — legally required record.
      </p>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Medicine</th>
              <th className="text-left px-4 py-2">Batch</th>
              <th className="text-right px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">Patient CNIC</th>
              <th className="text-left px-4 py-2">Doctor</th>
              <th className="text-left px-4 py-2">Sold By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.created_at.slice(0, 10)}</td>
                <td className="px-4 py-2 font-medium">{r.medicine_name}</td>
                <td className="px-4 py-2">{r.batch_no}</td>
                <td className="px-4 py-2 text-right">{r.qty}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.customer_cnic}</td>
                <td className="px-4 py-2">{r.doctor_name}</td>
                <td className="px-4 py-2">{r.sold_by}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-slate-400">No controlled sales recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}