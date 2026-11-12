import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Medicines from './pages/Medicines'
import Purchases from './pages/Purchases'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Customers from './pages/Customers'
import Expenses from './pages/Expenses'
import Returns from './pages/Returns'
import Doctors from './pages/Doctors'
import Prescriptions from './pages/Prescriptions'
import SalesHistory from './pages/SalesHistory'
import AuditLogs from './pages/AuditLogs'
import ProfitLoss from './pages/ProfitLoss'
import Inventory from './pages/Inventory' // <-- Imported

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/sales-history" element={<SalesHistory />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/pnl" element={<ProfitLoss />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/inventory" element={<Inventory />} /> {/* <-- Route Added */}
      </Route>
    </Routes>
  )
}