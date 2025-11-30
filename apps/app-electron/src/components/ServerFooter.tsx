import { useSessionStore, useAppUIStore } from '@quorum/app'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

/**
 * ServerFooter - Footer component for the server column
 * Matches the initial height of ChannelTextEntry (MessageInput area)
 * Height structure: border-t (1px) + p-3 (24px) + content height (40px) = ~65px
 */
export default function ServerFooter() {
  const sessionStore = useSessionStore()
  const uiStore = useAppUIStore()
  const { activeSession } = sessionStore()
  const { openContextMenu } = uiStore()

  function getInitials(): string {
    if (!activeSession) return '?'
    if (activeSession.displayName) {
      const parts = activeSession.displayName.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return activeSession.displayName[0].toUpperCase()
    }
    return activeSession.username[0].toUpperCase()
  }

  function handleProfileClick() {
    openContextMenu('user-profile')
  }

  return (
    <div className="bg-navigation/95 text-text-inverse border-t border-border-dark">
      <div className="p-3">
        <div className="h-10 flex items-center justify-between">
          {activeSession ? (
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-subtle/30 transition-colors group flex-1 min-w-0"
              title="View profile"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                style={{ backgroundColor: activeSession.avatarColor }}
              >
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-text-inverse truncate">
                  {activeSession.displayName || activeSession.username}
                </p>
                <p className="text-xs text-text-inverse-muted truncate">
                  @{activeSession.username}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faUser}
                className="w-4 h-4 text-text-inverse-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              />
            </button>
          ) : (
            <div className="text-xs text-text-inverse-muted">
              <p>Not signed in</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

