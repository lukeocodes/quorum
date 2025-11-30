import { useState } from 'react'
import { useSessionStore, useChannelStore } from '../store/hooks'
import { Button } from './primitives'

interface CreateChannelModalProps {
  onClose: () => void
}

export default function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const sessionStore = useSessionStore()
  const channelStore = useChannelStore()
  const { currentServer } = sessionStore()
  const { create: createChannel } = channelStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentServer) {
      setError('No server selected')
      return
    }

    if (!name.trim()) {
      setError('Channel name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await createChannel(currentServer.id, name.trim(), description.trim())
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create channel')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Create Channel</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                Channel Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-selected"
                placeholder="e.g., announcements"
                disabled={isCreating}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-selected resize-none"
                placeholder="What's this channel about?"
                rows={3}
                disabled={isCreating}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isCreating || !name.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

