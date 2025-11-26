import { useState, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { Button } from '@quorum/ui'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faChevronDown, faPencil, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import ContextMenu, { ContextMenuItem } from './ContextMenu'

/**
 * ServerTopbar - Shows the server name and controls at the top of the middle column
 */
export default function ServerTopbar() {
  const { currentServer } = useAppStore()
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  if (!currentServer) return null

  const handleServerNameClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setContextMenuPos({ x: rect.left, y: rect.bottom + 4 })
      setShowContextMenu(true)
    }
  }

  const getServerContextMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: 'Edit Server',
        icon: <FontAwesomeIcon icon={faPencil} />,
        onClick: () => {
          // TODO: Implement edit server
          alert('Edit server coming soon!')
        },
      },
    ]

    // Only show leave for user-added servers
    if (currentServer.role === 'user') {
      items.push({
        label: 'Leave Server',
        icon: <FontAwesomeIcon icon={faRightFromBracket} />,
        variant: 'danger',
        separator: true,
        onClick: () => {
          // TODO: Implement leave server
          if (confirm(`Are you sure you want to leave ${currentServer.name}?`)) {
            alert('Leave server coming soon!')
          }
        },
      })
    }

    return items
  }

  return (
    <>
      <div className="bg-navigation/95 text-text-inverse border-b border-border-dark">
        <div className="h-16 flex items-center justify-between px-6">
          <button
            ref={buttonRef}
            onClick={handleServerNameClick}
            className="group flex items-center gap-2 text-left text-lg font-semibold text-text-inverse hover:text-text-primary transition-colors px-2 py-1 -ml-2 rounded hover:bg-subtle/30"
            title="Server options"
          >
            <span>{currentServer.name}</span>
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </button>
          <Button
            variant="unstyled"
            size="icon"
            onClick={() => {/* TODO: Open settings modal */}}
            className="p-1.5 hover:bg-subtle rounded transition-colors"
            title="Server settings"
          >
            <FontAwesomeIcon icon={faCog} className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          items={getServerContextMenuItems()}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </>
  )
}

