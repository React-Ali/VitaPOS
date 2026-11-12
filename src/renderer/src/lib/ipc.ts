export const ipc = {
  auth: { login: (u: string, p: string) => window.api.auth.login(u, p) },
  medicine: {
    search: (q: string) => window.api.medicine.search(q), 
    list: () => window.api.medicine.list(),
    create: (i: any, uid: number) => window.api.medicine.create(i, uid),
    update: (id: number, i: any, uid: number) => window.api.medicine.update(id, i, uid),
    delete: (id: number, uid: number) => window.api.medicine.delete(id, uid),
    batches: (id: number) => window.api.medicine.batches(id)
  },
  sales: { 
    create: (i: any, uid: number) => window.api.sales.create(i, uid),
    history: () => window.api.sales.history(),
    details: (id: number) => window.api.sales.details(id),
    delete: (id: number, uid: number) => window.api.sales.delete(id, uid)
  },
  inventory: { 
    addStock: (i: any, uid: number) => window.api.inventory.addStock(i, uid),
    purchases: () => window.api.inventory.purchases(),
    updateBatch: (id: number, i: any) => window.api.inventory.updateBatch(id, i),
    deleteBatch: (id: number) => window.api.inventory.deleteBatch(id),
    adjust: (bId: number, qty: number, type: string, notes: string, uid: number) => window.api.inventory.adjust(bId, qty, type, notes, uid),
    lowStock: () => window.api.inventory.lowStock(),
    expiring: () => window.api.inventory.expiring(),
    returnHistory: () => window.api.inventory.returnHistory()
  },
  dashboard: { 
    stats: () => window.api.dashboard.stats(), 
    alerts: () => window.api.dashboard.alerts() 
  },
  user: { 
    list: () => window.api.user.list(), 
    create: (i: any) => window.api.user.create(i),
    update: (id: number, i: any) => window.api.user.update(id, i),
    toggle: (id: number, a: boolean) => window.api.user.toggle(id, a),
    delete: (id: number) => window.api.user.delete(id)
  },
  print: { 
    receipt: (h: string) => window.api.print.receipt(h),
    a4: (h: string) => window.api.print.a4(h)
  },
  settings: { 
    get: () => window.api.settings.get(), 
    update: (k: string, v: string) => window.api.settings.update(k, v) 
  },
  system: { 
    backup: () => window.api.system.backup(),
    heal: () => window.api.system.heal()
  },
  customer: { 
    list: () => window.api.customer.list(), 
    create: (c: any) => window.api.customer.create(c),
    update: (id: number, c: any) => window.api.customer.update(id, c),
    delete: (id: number) => window.api.customer.delete(id),
    ledger: (id: number) => window.api.customer.ledger(id),
    pay: (id: number, amount: number, notes: string, date: string) => window.api.customer.pay(id, amount, notes, date)
  },
  supplier: {
    list: () => window.api.supplier.list(),
    create: (i: any) => window.api.supplier.create(i),
    delete: (id: number) => window.api.supplier.delete(id),
    ledger: (id: number) => window.api.supplier.ledger(id),
    pay: (id: number, amount: number, notes: string) => window.api.supplier.pay(id, amount, notes)
  },
  expense: { 
    list: () => window.api.expense.list(), 
    create: (e: any) => window.api.expense.create(e) 
  },
  report: { 
    sales: (s: string, e: string) => window.api.report.sales(s, e),
    profit: (s: string, e: string) => window.api.report.profit(s, e),
    pnl: (s: string, e: string) => window.api.report.pnl(s, e)
  },
  return: { 
    getSale: (inv: string) => window.api.return.getSale(inv),
    process: (saleId: number, items: any[], uid: number, reason: string) => window.api.return.process(saleId, items, uid, reason),
    history: () => window.api.return.history()
  },
  doctor: {
    list: () => window.api.doctor.list(), 
    create: (i: any) => window.api.doctor.create(i),
    update: (id: number, i: any) => window.api.doctor.update(id, i),
    delete: (id: number) => window.api.doctor.delete(id),
    prescriptions: () => window.api.doctor.prescriptions()
  },
  audit: { 
    logs: () => window.api.audit.logs() 
  }
}

// Formatting Helpers
export const fmtPKR = (n: number) => `Rs. ${n.toFixed(2)}`

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const isoString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
  return new Date(isoString).toLocaleString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const isoString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
  return new Date(isoString).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const isoString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
  return new Date(isoString).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
};