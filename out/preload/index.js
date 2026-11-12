"use strict";
const electron = require("electron");
const api = {
  auth: { login: (u, p) => electron.ipcRenderer.invoke("auth:login", u, p) },
  medicine: {
    search: (q) => electron.ipcRenderer.invoke("medicine:search", q),
    list: () => electron.ipcRenderer.invoke("medicine:list"),
    create: (i, uid) => electron.ipcRenderer.invoke("medicine:create", i, uid),
    update: (id, i, uid) => electron.ipcRenderer.invoke("medicine:update", id, i, uid),
    delete: (id, uid) => electron.ipcRenderer.invoke("medicine:delete", id, uid),
    batches: (id) => electron.ipcRenderer.invoke("medicine:batches", id)
  },
  sales: {
    create: (i, uid) => electron.ipcRenderer.invoke("sales:create", i, uid),
    history: () => electron.ipcRenderer.invoke("sales:history"),
    details: (id) => electron.ipcRenderer.invoke("sales:details", id),
    delete: (id, uid) => electron.ipcRenderer.invoke("sales:delete", id, uid)
  },
  inventory: {
    addStock: (i, uid) => electron.ipcRenderer.invoke("inventory:addStock", i, uid),
    purchases: () => electron.ipcRenderer.invoke("inventory:purchases"),
    updateBatch: (id, i) => electron.ipcRenderer.invoke("inventory:updateBatch", id, i),
    deleteBatch: (id) => electron.ipcRenderer.invoke("inventory:deleteBatch", id),
    adjust: (bId, qty, type, notes, uid) => electron.ipcRenderer.invoke("inventory:adjust", bId, qty, type, notes, uid),
    lowStock: () => electron.ipcRenderer.invoke("inventory:lowStock"),
    expiring: () => electron.ipcRenderer.invoke("inventory:expiring"),
    returnHistory: () => electron.ipcRenderer.invoke("inventory:returnHistory")
  },
  dashboard: {
    stats: () => electron.ipcRenderer.invoke("dashboard:stats"),
    alerts: () => electron.ipcRenderer.invoke("dashboard:alerts")
  },
  user: {
    list: () => electron.ipcRenderer.invoke("user:list"),
    create: (i) => electron.ipcRenderer.invoke("user:create", i),
    update: (id, i) => electron.ipcRenderer.invoke("user:update", id, i),
    toggle: (id, a) => electron.ipcRenderer.invoke("user:toggle", id, a),
    delete: (id) => electron.ipcRenderer.invoke("user:delete", id)
  },
  print: {
    receipt: (h) => electron.ipcRenderer.invoke("print:receipt", h),
    a4: (h) => electron.ipcRenderer.invoke("print:a4", h)
  },
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    update: (k, v) => electron.ipcRenderer.invoke("settings:update", k, v)
  },
  system: {
    backup: () => electron.ipcRenderer.invoke("system:backup"),
    heal: () => electron.ipcRenderer.invoke("system:heal")
  },
  customer: {
    list: () => electron.ipcRenderer.invoke("customer:list"),
    create: (c) => electron.ipcRenderer.invoke("customer:create", c),
    update: (id, c) => electron.ipcRenderer.invoke("customer:update", id, c),
    delete: (id) => electron.ipcRenderer.invoke("customer:delete", id),
    ledger: (id) => electron.ipcRenderer.invoke("customer:ledger", id),
    pay: (id, amount, notes, date) => electron.ipcRenderer.invoke("customer:pay", id, amount, notes, date)
  },
  supplier: {
    list: () => electron.ipcRenderer.invoke("supplier:list"),
    create: (i) => electron.ipcRenderer.invoke("supplier:create", i),
    delete: (id) => electron.ipcRenderer.invoke("supplier:delete", id),
    ledger: (id) => electron.ipcRenderer.invoke("supplier:ledger", id),
    pay: (id, amount, notes) => electron.ipcRenderer.invoke("supplier:pay", id, amount, notes)
  },
  expense: {
    list: () => electron.ipcRenderer.invoke("expense:list"),
    create: (e) => electron.ipcRenderer.invoke("expense:create", e)
  },
  report: {
    sales: (s, e) => electron.ipcRenderer.invoke("report:sales", s, e),
    profit: (s, e) => electron.ipcRenderer.invoke("report:profit", s, e),
    pnl: (s, e) => electron.ipcRenderer.invoke("report:pnl", s, e)
  },
  return: {
    getSale: (inv) => electron.ipcRenderer.invoke("return:getSale", inv),
    process: (saleId, items, uid, reason) => electron.ipcRenderer.invoke("return:process", saleId, items, uid, reason),
    history: () => electron.ipcRenderer.invoke("return:history")
  },
  doctor: {
    list: () => electron.ipcRenderer.invoke("doctor:list"),
    create: (i) => electron.ipcRenderer.invoke("doctor:create", i),
    update: (id, i) => electron.ipcRenderer.invoke("doctor:update", id, i),
    delete: (id) => electron.ipcRenderer.invoke("doctor:delete", id),
    prescriptions: () => electron.ipcRenderer.invoke("doctor:prescriptions")
  },
  audit: {
    logs: () => electron.ipcRenderer.invoke("audit:logs")
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
