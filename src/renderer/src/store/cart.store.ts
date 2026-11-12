import { create } from 'zustand'

export interface CartLine {
  medicineId: number
  medicineName: string
  batchId: number
  batchNo: string
  schedule: 'none' | 'G' | 'D' | 'H'
  qty: number
  unitPrice: number
  maxQty: number
}

export interface HeldBill {
  id: string
  customerId: number | ''
  lines: CartLine[]
  timestamp: number
}

interface CartState {
  lines: CartLine[]
  customerId: number | ''
  heldBills: HeldBill[]
  
  setCustomer: (id: number | '') => void
  addLine: (line: CartLine) => void
  updateQty: (batchId: number, qty: number) => void
  removeLine: (batchId: number) => void
  clear: () => void
  total: () => number
  
  holdCurrentBill: () => void
  resumeBill: (id: string) => void
  deleteHeldBill: (id: string) => void
}

export const useCart = create<CartState>((set, get) => ({
  lines: [],
  customerId: '',
  heldBills: [],

  setCustomer: (id) => set({ customerId: id }),

  addLine: (line) => {
    const existing = get().lines.find((l) => l.batchId === line.batchId)
    if (existing) {
      const newQty = Math.min(existing.qty + line.qty, existing.maxQty)
      set({ lines: get().lines.map((l) => l.batchId === line.batchId ? { ...l, qty: newQty } : l) })
    } else {
      set({ lines: [...get().lines, line] })
    }
  },
  
  updateQty: (batchId, qty) => {
    set({
      lines: get().lines.map((l) => {
        if (l.batchId === batchId) {
          const safeQty = Math.max(1, Math.min(qty, l.maxQty))
          return { ...l, qty: safeQty }
        }
        return l
      })
    })
  },
  
  removeLine: (batchId) => set({ lines: get().lines.filter((l) => l.batchId !== batchId) }),
  clear: () => set({ lines: [], customerId: '' }),
  total: () => get().lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),

  holdCurrentBill: () => {
    const { lines, customerId, heldBills } = get()
    if (lines.length === 0) return
    const newBill: HeldBill = {
      id: Date.now().toString(),
      customerId,
      lines,
      timestamp: Date.now()
    }
    set({ heldBills: [...heldBills, newBill], lines: [], customerId: '' })
  },

  resumeBill: (id) => {
    const { heldBills, lines, customerId } = get()
    const billToResume = heldBills.find(b => b.id === id)
    if (!billToResume) return
    
    // If there is currently a cart, hold it before resuming
    if (lines.length > 0) {
      get().holdCurrentBill()
    }

    set({
      lines: billToResume.lines,
      customerId: billToResume.customerId,
      heldBills: get().heldBills.filter(b => b.id !== id)
    })
  },

  deleteHeldBill: (id) => set({ heldBills: get().heldBills.filter(b => b.id !== id) })
}))