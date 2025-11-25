import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'
import ServerTopbar from './ServerTopbar'
import ServerSidebar from './ServerSidebar'
import ServerFooter from './ServerFooter'
import ChannelTopbar from './ChannelTopbar'
import ChannelChatArea from './ChannelChatArea'
import ServerSelection from './ServerSelectionEmpty'

export default function MainLayout() {
  const { activeSession, servers, currentServer, currentRoom } = useAppStore()
  
  // Resizable Server column state
  const [serverColumnWidth, setServerColumnWidth] = useState(320) // Default 320px
  const [isResizing, setIsResizing] = useState(false)
  const [isLoadingWidth, setIsLoadingWidth] = useState(true)
  const MIN_WIDTH = 240
  const MAX_WIDTH = 600
  const saveWidthTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load server column width from SQLite when session changes (app-level preference)
  useEffect(() => {
    async function loadServerColumnWidth() {
      if (!activeSession) {
        console.log('🔍 No active session, skipping width load')
        setIsLoadingWidth(false)
        return
      }

      try {
        setIsLoadingWidth(true)
        console.log('🔍 Loading server column width for session:', activeSession.id)
        const result = await window.electronAPI.loadAppUIPreference(
          activeSession.id,
          'server_column_width'
        )
        console.log('🔍 Load result:', result)

        if (result.success && result.data) {
          const width = parseInt(result.data, 10)
          console.log('🔍 Parsed width:', width, 'Valid range:', MIN_WIDTH, '-', MAX_WIDTH)
          if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
            console.log('✅ Server column width loaded from SQLite:', width)
            setServerColumnWidth(width)
          } else {
            console.log('⚠️ Width out of range or invalid')
          }
        } else {
          console.log('⚠️ No saved width found or load failed')
        }
      } catch (error) {
        console.error('Error loading server column width:', error)
      } finally {
        setIsLoadingWidth(false)
      }
    }

    loadServerColumnWidth()
  }, [activeSession])

  // Save server column width to SQLite when it changes (debounced)
  useEffect(() => {
    if (isLoadingWidth || !activeSession) {
      return
    }

    // Debounce saves to avoid too many writes
    if (saveWidthTimeoutRef.current) {
      clearTimeout(saveWidthTimeoutRef.current)
    }

    saveWidthTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('💾 Saving width:', serverColumnWidth, 'for session:', activeSession.id)
        const result = await window.electronAPI.saveAppUIPreference(
          activeSession.id,
          'server_column_width',
          serverColumnWidth.toString()
        )
        console.log('💾 Save result:', result)
        console.log('✅ Server column width saved to SQLite:', serverColumnWidth)
      } catch (error) {
        console.error('Error saving server column width:', error)
      }
    }, 500) // 500ms debounce

    return () => {
      if (saveWidthTimeoutRef.current) {
        clearTimeout(saveWidthTimeoutRef.current)
      }
    }
  }, [serverColumnWidth, activeSession])

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = e.clientX - 80 // Account for AppSidebar width (80px = w-20)
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setServerColumnWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // Prevent text selection while resizing
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing])

  // Handle server change
  const handleServerChange = (server: any) => {
    console.log('Server changed:', server)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-off-white">
      {/* App topbar (full width at top) */}
      <AppTopbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* App sidebar (narrow left column) - always visible */}
        <AppSidebar onServerChange={handleServerChange} />
        
        {!activeSession || servers.length === 0 ? (
          /* No session or no servers - show welcome screen */
          <ServerSelection />
        ) : currentServer ? (
          <>
            {/* Server column: Resizable column with ServerTopbar, ServerSidebar, and ServerFooter */}
            <div 
              className="flex flex-col h-full overflow-hidden bg-navigation/95 border-r border-border-dark relative"
              style={{ 
                width: `${serverColumnWidth}px`, 
                minWidth: `${MIN_WIDTH}px`, 
                maxWidth: `${MAX_WIDTH}px`,
                flexShrink: 0
              }}
            >
              <ServerTopbar />
              <ServerSidebar />
              <ServerFooter />
              
              {/* Resize Handle */}
              <div
                className={`
                  absolute top-0 right-0 w-1 h-full cursor-col-resize
                  hover:bg-selected/50 transition-colors z-10
                  ${isResizing ? 'bg-selected' : ''}
                `}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsResizing(true)
                }}
                title="Drag to resize server column"
              />
            </div>
            
            {/* Right column: Channel topbar + Channel chat area */}
            {currentRoom ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChannelTopbar />
                <ChannelChatArea />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-2xl font-semibold text-text-primary mb-2">
                    Welcome to Quorum
                  </h2>
                  <p className="text-text-tertiary">
                    Select a channel or create a new one to start a discussion
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <ServerSelection />
        )}
      </div>
    </div>
  )
}

