import { useAppStore } from '../store/appStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHashtag, faUsers, faCalendar, faFileLines } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@quorum/ui'

export default function ChannelDetails() {
  const { currentRoom, aiMembers, rooms } = useAppStore()

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-tertiary">No channel selected</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Channel Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-selected rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faHashtag} className="w-6 h-6 text-text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {currentRoom.name}
            </h2>
            <p className="text-sm text-text-tertiary">Channel Details</p>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="flex items-center gap-2 text-text-secondary">
          <FontAwesomeIcon icon={faFileLines} className="w-4 h-4" />
          <h3 className="font-semibold">Description</h3>
        </div>
        <p className="text-text-secondary">
          {currentRoom.description || 'No description provided'}
        </p>
      </div>

      {/* Channel Info */}
      <div className="space-y-4 pb-6 border-b border-border">
        <h3 className="font-semibold text-text-primary">Channel Information</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-text-tertiary mt-1" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Created</p>
              <p className="text-sm text-text-tertiary">{formatDate(currentRoom.created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-text-tertiary mt-1" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Last Updated</p>
              <p className="text-sm text-text-tertiary">{formatDate(currentRoom.updated_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-text-tertiary mt-1" />
            <div>
              <p className="text-sm font-medium text-text-secondary">AI Members</p>
              <p className="text-sm text-text-tertiary">{aiMembers.length} active</p>
            </div>
          </div>

          {currentRoom.is_shared !== undefined && (
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-1 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${currentRoom.is_shared ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Visibility</p>
                <p className="text-sm text-text-tertiary">
                  {currentRoom.is_shared ? 'Shared across servers' : 'Private to this server'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Members List */}
      {aiMembers.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-text-primary">AI Members</h3>
          <div className="space-y-2">
            {aiMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-subtle hover:bg-subtle/80 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: member.avatar_color }}
                >
                  {member.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{member.name}</p>
                  <p className="text-xs text-text-tertiary">
                    {member.provider} · {member.model}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-border">
        <Button
          variant="unstyled"
          className="w-full text-left px-4 py-2 text-text-secondary hover:bg-subtle rounded-lg transition-colors"
          onClick={() => {
            // TODO: Implement edit channel
            alert('Edit channel coming soon!')
          }}
        >
          Edit Channel
        </Button>
        {currentRoom.name !== 'general' && (
          <Button
            variant="unstyled"
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={() => {
              if (confirm(`Are you sure you want to delete #${currentRoom.name}?`)) {
                alert('Delete channel coming soon!')
              }
            }}
          >
            Delete Channel
          </Button>
        )}
      </div>
    </div>
  )
}

