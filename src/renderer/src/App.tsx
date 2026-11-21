import { useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import { AppRouter } from './router'
import { useAuth } from './store/auth.store'
import Login from './pages/Login'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  const { user, clear, updateActivity, lastActivity } = useAuth()

  // Auto Logout Timer (6 Hours Inactivity)
  useEffect(() => {
    if (!user) return

    const checkInactivity = setInterval(() => {
      const sixHours = 6 * 60 * 60 * 1000
      if (Date.now() - lastActivity > sixHours) {
        alert('Session expired due to 6 hours of inactivity. Please log in again.')
        clear()
      }
    }, 60000) // Check every minute

    // Update activity on any mouse click or key press
    const resetTimer = () => updateActivity()
    window.addEventListener('click', resetTimer)
    window.addEventListener('keydown', resetTimer)

    return () => {
      clearInterval(checkInactivity)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('keydown', resetTimer)
    }
  }, [user, lastActivity, clear, updateActivity])

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