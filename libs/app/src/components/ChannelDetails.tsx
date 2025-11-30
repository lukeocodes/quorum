import { useChannelStore } from '../store/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHashtag, faCalendar, faFileLines } from '@fortawesome/free-solid-svg-icons'
import { Button } from './primitives'

export default function ChannelDetails() {
  const channelStore = useChannelStore()
  const { currentChannel } = channelStore()

  if (!currentChannel) {
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
              {currentChannel.name}
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
          {currentChannel.description || 'No description provided'}
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
              <p className="text-sm text-text-tertiary">{formatDate(currentChannel.created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-text-tertiary mt-1" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Last Updated</p>
              <p className="text-sm text-text-tertiary">{formatDate(currentChannel.updated_at)}</p>
            </div>
          </div>

          {currentChannel.is_shared !== undefined && (
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-1 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${currentChannel.is_shared ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Visibility</p>
                <p className="text-sm text-text-tertiary">
                  {currentChannel.is_shared ? 'Shared across servers' : 'Private to this server'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
        {currentChannel.name !== 'general' && (
          <Button
            variant="unstyled"
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={() => {
              if (confirm(`Are you sure you want to delete #${currentChannel.name}?`)) {
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

