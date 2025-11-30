import { useState, useEffect, useRef } from 'react'
import { useSessionStore, useAppUIStore } from '../store/hooks'
import { usePlatformAdapter } from '../adapters'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { Button } from './primitives'
import ChannelDetails from './ChannelDetails'
import UserProfile from './UserProfile'

export default function CollapsibleContextMenu() {
  const adapter = usePlatformAdapter()
  const sessionStore = useSessionStore()
  const uiStore = useAppUIStore()
  const { activeSession } = sessionStore()
  const {
    contextMenuOpen,
    contextMenuContent,
    contextMenuWidth,
    setContextMenuWidth,
    closeContextMenu,
  } = uiStore()

  const [isResizing, setIsResizing] = useState(false)
  const [isLoadingWidth, setIsLoadingWidth] = useState(true)
  const MIN_WIDTH = 440
  const MAX_WIDTH = 600
  const saveWidthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load context menu width from storage when session changes
  useEffect(() => {
    async function loadContextMenuWidth() {
      if (!activeSession) {
        setIsLoadingWidth(false)
        return
      }

      try {
        setIsLoadingWidth(true)
        const result = await adapter.loadAppUIPreference(
          activeSession.id,
          'context_menu_width'
        )

        if (result.success && result.data) {
          const width = parseInt(result.data, 10)
          if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
            setContextMenuWidth(width)
          }
        }
      } catch (error) {
        console.error('Error loading context menu width:', error)
      } finally {
        setIsLoadingWidth(false)
      }
    }

    loadContextMenuWidth()
  }, [activeSession, adapter, setContextMenuWidth])

  // Save context menu width when it changes (debounced)
  useEffect(() => {
    if (isLoadingWidth || !activeSession) {
      return
    }

    if (saveWidthTimeoutRef.current) {
      clearTimeout(saveWidthTimeoutRef.current)
    }

    saveWidthTimeoutRef.current = setTimeout(async () => {
      try {
        await adapter.saveAppUIPreference(
          activeSession.id,
          'context_menu_width',
          contextMenuWidth.toString()
        )
      } catch (error) {
        console.error('Error saving context menu width:', error)
      }
    }, 500)

    return () => {
      if (saveWidthTimeoutRef.current) {
        clearTimeout(saveWidthTimeoutRef.current)
      }
    }
  }, [contextMenuWidth, activeSession, adapter, isLoadingWidth])

  // Handle resize with channel minimum constraint
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      // Layout constraints
      const APP_SIDEBAR_WIDTH = 80
      const CHANNEL_MIN_WIDTH = 700
      
      // Get current server column width from DOM (it might be hidden)
      const serverColumn = document.querySelector('[data-server-column]') as HTMLElement
      const serverColumnWidth = serverColumn ? serverColumn.offsetWidth : 0

      // Calculate from right edge of screen
      const newWidth = window.innerWidth - e.clientX
      
      // Calculate maximum context menu width to maintain channel minimum
      const maxContextMenuWidth = window.innerWidth - APP_SIDEBAR_WIDTH - serverColumnWidth - CHANNEL_MIN_WIDTH
      
      // Constrain to valid range
      const constrainedWidth = Math.max(
        MIN_WIDTH,
        Math.min(newWidth, Math.min(MAX_WIDTH, maxContextMenuWidth))
      )
      
      if (constrainedWidth !== contextMenuWidth) {
        setContextMenuWidth(constrainedWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, setContextMenuWidth, contextMenuWidth])

  if (!contextMenuOpen) {
    return null
  }

  const getTitle = () => {
    switch (contextMenuContent) {
      case 'channel-details':
        return 'Channel Details'
      case 'user-profile':
        return 'User Profile'
      default:
        return 'Details'
    }
  }

  const renderContent = () => {
    switch (contextMenuContent) {
      case 'channel-details':
        return <ChannelDetails />
      case 'user-profile':
        return <UserProfile />
      default:
        return null
    }
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-white border-l border-border relative"
      style={{
        width: `${contextMenuWidth}px`,
        minWidth: `${MIN_WIDTH}px`,
        maxWidth: `${MAX_WIDTH}px`,
        flexShrink: 0,
        transition: isResizing ? 'none' : 'width 0.3s ease-in-out',
      }}
    >
      {/* Resize Handle (on the left edge) */}
      <div
        className={`
          absolute top-0 left-0 w-1 h-full cursor-col-resize
          hover:bg-selected/50 transition-colors z-20
          ${isResizing ? 'bg-selected' : ''}
        `}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
        title="Drag to resize panel"
      />

      {/* Header */}
      <div className="bg-white border-b border-border flex-shrink-0">
        <div className="h-16 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-text-primary">{getTitle()}</h2>
          <Button
            variant="unstyled"
            size="icon"
            onClick={closeContextMenu}
            className="p-2 text-text-secondary hover:bg-subtle rounded-lg transition-colors"
            title="Close panel"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}

