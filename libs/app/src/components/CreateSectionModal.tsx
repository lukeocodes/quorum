import { useState } from 'react'
import { Button } from './primitives'

interface CreateSectionModalProps {
  onClose: () => void
  onCreateSection: (name: string, type: string) => void
}

export default function CreateSectionModal({ onClose, onCreateSection }: CreateSectionModalProps) {
  const [name, setName] = useState('')
  const [type] = useState('channels') // For now, only channels type
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Section name is required')
      return
    }

    onCreateSection(name.trim(), type)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Create Section</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                Section Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-selected"
                placeholder="e.g., Projects"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Type
              </label>
              <div className="text-sm text-text-tertiary">
                Channels (more types coming soon)
              </div>
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim()}
            >
              Create Section
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

