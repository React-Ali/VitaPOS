import { contextBridge, ipcRenderer } from 'electron'

const api = {
  auth: { 
    login: (u: string, p: string) => ipcRenderer.invoke('auth:login', u, p),
    reset: (u: string, p: string, key: string) => ipcRenderer.invoke('auth:reset', u, p, key),
    generateCode: (username: string) => ipcRenderer.invoke('auth:generateCode', username)
  },
  medicine: {
    search: (q: string) => ipcRenderer.invoke('medicine:search', q), 
    list: () => ipcRenderer.invoke('medicine:list'),
    create: (i: any, uid: number) => ipcRenderer.invoke('medicine:create', i, uid),
    update: (id: number, i: any, uid: number) => ipcRenderer.invoke('medicine:update', id, i, uid),
    delete: (id: number, uid: number) => ipcRenderer.invoke('medicine:delete', id, uid),
    batches: (id: number) => ipcRenderer.invoke('medicine:batches', id),
    getByBarcode: (code: string) => ipcRenderer.invoke('medicine:barcode', code)
  },
  sales: { 
    create: (i: any, uid: number) => ipcRenderer.invoke('sales:create', i, uid),
    history: () => ipcRenderer.invoke('sales:history'),
    details: (id: number) => ipcRenderer.invoke('sales:details', id),
    delete: (id: number, uid: number) => ipcRenderer.invoke('sales:delete', id, uid)
  },
  inventory: { 
    addStock: (i: any, uid: number) => ipcRenderer.invoke('inventory:addStock', i, uid),
    purchases: () => ipcRenderer.invoke('inventory:purchases'),
    updateBatch: (id: number, i: any) => ipcRenderer.invoke('inventory:updateBatch', id, i),
    deleteBatch: (id: number) => ipcRenderer.invoke('inventory:deleteBatch', id),
    adjust: (bId: number, qty: number, type: string, notes: string, uid: number) => ipcRenderer.invoke('inventory:adjust', bId, qty, type, notes, uid),
    lowStock: () => ipcRenderer.invoke('inventory:lowStock'),
    expiring: () => ipcRenderer.invoke('inventory:expiring'),
    returnHistory: () => ipcRenderer.invoke('inventory:returnHistory')
  },
  dashboard: { 
    stats: () => ipcRenderer.invoke('dashboard:stats'), 
    alerts: () => ipcRenderer.invoke('dashboard:alerts') 
  },
  user: { 
    list: () => ipcRenderer.invoke('user:list'), 
    create: (i: any) => ipcRenderer.invoke('user:create', i),
    update: (id: number, i: any) => ipcRenderer.invoke('user:update', id, i),
    toggle: (id: number, a: boolean) => ipcRenderer.invoke('user:toggle', id, a),
    delete: (id: number) => ipcRenderer.invoke('user:delete', id)
  },
  print: { 
    receipt: (h: string) => ipcRenderer.invoke('print:receipt', h),
    a4: (h: string) => ipcRenderer.invoke('print:a4', h)
  },
  settings: { 
    get: () => ipcRenderer.invoke('settings:get'), 
    update: (k: string, v: string) => ipcRenderer.invoke('settings:update', k, v) 
  },
  system: { 
    backup: () => ipcRenderer.invoke('system:backup'),
    heal: () => ipcRenderer.invoke('system:heal')
  },
  customer: { 
    list: () => ipcRenderer.invoke('customer:list'), 
    create: (c: any) => ipcRenderer.invoke('customer:create', c),
    update: (id: number, c: any) => ipcRenderer.invoke('customer:update', id, c),
    delete: (id: number) => ipcRenderer.invoke('customer:delete', id),
    ledger: (id: number) => ipcRenderer.invoke('customer:ledger', id),
    pay: (id: number, amount: number, notes: string, date: string) => ipcRenderer.invoke('customer:pay', id, amount, notes, date)
  },
  supplier: {
    list: () => ipcRenderer.invoke('supplier:list'),
    create: (i: any) => ipcRenderer.invoke('supplier:create', i),
    delete: (id: number) => ipcRenderer.invoke('supplier:delete', id),
    ledger: (id: number) => ipcRenderer.invoke('supplier:ledger', id),
    pay: (id: number, amount: number, notes: string) => ipcRenderer.invoke('supplier:pay', id, amount, notes)
  },
  expense: { 
    list: () => ipcRenderer.invoke('expense:list'), 
    create: (e: any) => ipcRenderer.invoke('expense:create', e) 
  },
  report: { 
    sales: (s: string, e: string) => ipcRenderer.invoke('report:sales', s, e),
    profit: (s: string, e: string) => ipcRenderer.invoke('report:profit', s, e),
    pnl: (s: string, e: string) => ipcRenderer.invoke('report:pnl', s, e)
  },
  return: { 
    getSale: (inv: string) => ipcRenderer.invoke('return:getSale', inv),
    process: (saleId: number, items: any[], uid: number, reason: string) => ipcRenderer.invoke('return:process', saleId, items, uid, reason),
    history: () => ipcRenderer.invoke('return:history')
  },
  doctor: {
    list: () => ipcRenderer.invoke('doctor:list'), 
    create: (i: any) => ipcRenderer.invoke('doctor:create', i),
    update: (id: number, i: any) => ipcRenderer.invoke('doctor:update', id, i),
    delete: (id: number) => ipcRenderer.invoke('doctor:delete', id),
    prescriptions: () => ipcRenderer.invoke('doctor:prescriptions')
  },
  audit: { 
    logs: () => ipcRenderer.invoke('audit:logs') 
  },
  network: {
    get: () => ipcRenderer.invoke('network:get'),
    set: (config: any) => ipcRenderer.invoke('network:set', config),
    test: () => ipcRenderer.invoke('network:test')
  },
  app: {
    relaunch: () => ipcRenderer.invoke('app:relaunch')
  }
}

contextBridge.exposeInMainWorld('api', api)
export type Api = typeof api