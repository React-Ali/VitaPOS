import { useEffect, useState } from 'react'
import { ipc, fmtPKR, formatDateTime } from '../lib/ipc'
import { downloadCSV } from '../lib/export'
import { useAuth } from '../store/auth.store'
import { Printer, FileDown, Trash2, AlertTriangle } from 'lucide-react'

export default function SalesHistory() {
  const { user } = useAuth()
  const [sales, setSales] = useState<any[]>([])
  
  // Delete States
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const isAdmin = user?.role === 'admin'

  const load = () => {
    ipc.sales.history().then(setSales).catch(console.error)
  }

  useEffect(() => { load() }, [])

  const exportData = () => {
    const headers = ['Invoice No', 'Date & Time', 'Customer', 'Cashier', 'Payment Method', 'Total (PKR)']
    const rows = sales.map(s => [s.invoice_no, formatDateTime(s.created_at), s.customer_name || 'Walk-in', s.cashier, s.payment_method, s.total.toFixed(2)])
    downloadCSV('Sales_History.csv', headers, rows)
  }

  const executeDelete = async () => {
    if (!confirmDelete) return
    setDeleteError('')
    try {
      await ipc.sales.delete(confirmDelete.id, user!.id)
      setConfirmDelete(null)
      load()
    } catch (err: any) {
      setDeleteError(err.message)
    }
  }

  const printInvoice = async (saleId: number) => {
    try {
      const data = await ipc.sales.details(saleId)
      const settings = await ipc.settings.get()

      // NEW: 4 Columns (Item, Qty, Price, Total) just like the POS
      const itemsHtml = data.items.map((l: any) => `
        <tr>
          <td style="text-align:left; width: 40%; word-break: break-word;">${l.medicine_name}</td>
          <td style="text-align:center; width: 15%;">${l.qty}</td>
          <td style="text-align:right; width: 20%;">${l.unit_price.toFixed(2)}</td>
          <td style="text-align:right; width: 25%;">${l.line_total.toFixed(2)}</td>
        </tr>
      `).join('')

      const html = `
        <html>
          <head>
            <style>
              @page { size: 80mm 297mm; margin: 0; }
              body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 5mm; color: #000; font-size: 12px; box-sizing: border-box; }
              h2 { margin: 0 0 4px 0; font-size: 18px; text-transform: uppercase; text-align: center; font-weight: bold; }
              .meta { text-align: center; margin: 3px 0; font-size: 11px; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              .info { display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0; }
              table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; table-layout: fixed; }
              th { border-bottom: 1px dashed #000; border-top: 1px dashed #000; padding: 4px 0; text-align: left; font-weight: bold; }
              td { padding: 4px 0; }
              .totals { margin-top: 8px; font-size: 12px; }
              .totals-row { display: flex; justify-content: space-between; margin: 4px 0; }
              .grand-total { font-size: 16px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; margin: 8px 0; }
              .footer { text-align: center; font-size: 10px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <h2>${settings.shop_name || 'VitaPOS'}</h2>
            <div class="meta">${settings.shop_address || ''}</div>
            <div class="meta">Ph: ${settings.shop_phone || ''}</div>
            
            <div class="divider"></div>
            
            <div class="info">
              <span style="width: 60%;">Inv: <b>${data.sale.invoice_no}</b></span>
              <span style="width: 40%; text-align: right;">Date: ${formatDateTime(data.sale.created_at).split(',')[0]}</span>
            </div>
            <div class="info">
              <span style="width: 60%;">Cust: ${data.sale.customer_name || 'Walk-in'}</span>
              <span style="width: 40%; text-align: right;">Pay: ${data.sale.payment_method}</span>
            </div>
            
            <div class="divider"></div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 40%;">Item</th>
                  <th style="width: 15%; text-align:center;">Qty</th>
                  <th style="width: 20%; text-align:right;">Price</th>
                  <th style="width: 25%; text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>${data.sale.subtotal.toFixed(2)}</span>
              </div>
              ${data.sale.discount > 0 ? `<div class="totals-row"><span>Discount:</span><span>-${data.sale.discount.toFixed(2)}</span></div>` : ''}
              <div class="totals-row grand-total">
                <span>TOTAL:</span>
                <span>Rs. ${data.sale.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin:3px 0;">${settings.receipt_footer || 'Thank you for your business!'}</p>
              <p style="margin:3px 0;">Powered by VitaPOS</p>
            </div>
          </body>
        </html>
      `
      ipc.print.receipt(html)
    } catch (err) { 
      alert('Failed to load invoice details') 
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Sales History (Invoices)</h1>
          <p className="text-sm text-slate-500">View past transactions and reprint receipts.</p>
        </div>
        <button onClick={exportData} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 transition shadow-sm">
          <FileDown size={18} /> Export to Excel
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Invoice No</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Cashier</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sales.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.invoice_no}</td>
                <td className="px-6 py-4 text-slate-500">{formatDateTime(s.created_at)}</td>
                <td className="px-6 py-4">{s.customer_name || 'Walk-in'}</td>
                <td className="px-6 py-4 text-slate-500">{s.cashier}</td>
                <td className="px-6 py-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold">{s.payment_method}</span></td>
                <td className="px-6 py-4 text-right font-bold">{fmtPKR(s.total)}</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => printInvoice(s.id)} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900 transition" title="Print Receipt">
                    <Printer size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => { setConfirmDelete(s); setDeleteError(''); }} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition" title="Void/Delete Sale">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">No sales recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[400px] shadow-2xl text-center border-t-8 border-red-500">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Void Sale?</h3>
            {deleteError ? (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6 font-medium">{deleteError}</p>
            ) : (
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete invoice <b>{confirmDelete.invoice_no}</b>? The stock will be restored to inventory.</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300">
                {deleteError ? 'Close' : 'Cancel'}
              </button>
              {!deleteError && <button onClick={executeDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md">Delete Sale</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}