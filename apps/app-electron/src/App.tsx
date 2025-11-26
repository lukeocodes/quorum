import { useEffect, useState } from 'react'
import MainLayout from './components/MainLayout'
import LoadingScreen from './components/LoadingScreen'
import { useAppStore } from './store/appStore'

type AppState = 'initializing' | 'loading-servers' | 'ready'

function App() {
  const [appState, setAppState] = useState<AppState>('initializing')
  const { setActiveSession, servers } = useAppStore()

  useEffect(() => {
    loadSession()
    setupEventListeners()
  }, [])

  // Wait for servers to be fetched after session is set
  useEffect(() => {
    if (appState === 'loading-servers' && servers !== undefined) {
      // Small delay for smooth transition
      setTimeout(() => {
        setAppState('ready')
      }, 300)
    }
  }, [appState, servers])

  const loadSession = async () => {
    try {
      // Get active session
      const result = await window.electronAPI.getActiveSession()

      if (result.success && result.data) {
        // Set session and wait for servers to be fetched
        setAppState('loading-servers')
        setActiveSession(result.data)
        // The setActiveSession will trigger fetchServersForSession
        // We'll wait for that to complete via the useEffect above
      } else {
        // No active session, go straight to ready (will show welcome screen)
        setAppState('ready')
      }
    } catch (error) {
      console.error('Error loading session:', error)
      setAppState('ready')
    }
  }

  const setupEventListeners = () => {
    // Session added - refresh all servers instead of switching session
    window.electronAPI.onSessionAdded(async ({ session, serverId }) => {
      console.log('Session added:', session, 'serverId:', serverId)
      
      // Refresh all servers from all sessions
      const { fetchServersForSession, setCurrentServer } = useAppStore.getState()
      await fetchServersForSession(session.id)
      
      // If a specific server ID was provided, navigate to it
      if (serverId) {
        // Wait a bit for servers to be fetched
        setTimeout(async () => {
          const { servers } = useAppStore.getState()
          const targetServer = servers.find(s => s.id === serverId)
          if (targetServer) {
            console.log('Navigating to server:', targetServer.name)
            setCurrentServer(targetServer)
          }
        }, 500)
      }
    })

    // Session changed
    window.electronAPI.onSessionChanged(({ session }) => {
      console.log('Session changed:', session)
      setActiveSession(session)
    })

    // Session removed
    window.electronAPI.onSessionRemoved(({ sessionId }) => {
      console.log('Session removed:', sessionId)
      const { activeSession } = useAppStore.getState()
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(null)
      }
    })

    // Server removed
    window.electronAPI.onServerRemoved(({ serverId }) => {
      console.log('Server removed:', serverId)
      const { servers, setServers, currentServer, setCurrentServer } = useAppStore.getState()
      
      // Remove from servers list
      const newServers = servers.filter(s => s.id !== serverId)
      setServers(newServers)
      
      // If current server was removed, clear it
      if (currentServer && currentServer.id === serverId) {
        setCurrentServer(newServers.length > 0 ? newServers[0] : null)
      }
    })
  }

  if (appState !== 'ready') {
    return <LoadingScreen />
  }

  // Show main layout with smooth fade-in
  return (
    <div className="animate-fadeIn">
      <MainLayout />
    </div>
  )
}

export default App
