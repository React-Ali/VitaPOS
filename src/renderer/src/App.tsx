import { HashRouter } from 'react-router-dom'
import { AppRouter } from './router'
import { useAuth } from './store/auth.store'
import Login from './pages/Login'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  const { user } = useAuth()
  
  if (!user) return (
    <ErrorBoundary>
      <Login />
    </ErrorBoundary>
  )
  
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </ErrorBoundary>
  )
}