import { useEffect, useState } from 'react'
import { AuthScreen } from './components/AuthScreen'
import { ServerSelection } from './components/ServerSelection'
import MainLayout from './components/MainLayout'
import { useAppStore } from './store/appStore'

function App() {
  const [loading, setLoading] = useState(true)
  const { user, setUser, setAuthToken, currentServer } = useAppStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check if there's a stored auth token
      const storedToken = localStorage.getItem('authToken')
      
      if (storedToken) {
        // Validate the session
        const validatedUser = await window.electronAPI.validateSession(storedToken)
        
        if (validatedUser) {
          setUser(validatedUser)
          setAuthToken(storedToken)
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('authToken')
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      localStorage.removeItem('authToken')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-charcoal">
        <div className="text-text-primary text-xl">Loading Quorum...</div>
      </div>
    )
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen />
  }

  // Show server selection if no server selected
  if (!currentServer) {
    return <ServerSelection />
  }

  // Show main app
  return <MainLayout />
}

export default App
