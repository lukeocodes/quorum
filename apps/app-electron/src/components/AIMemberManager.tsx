import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@quorum/app'

interface AIMemberManagerProps {
  onClose: () => void
}

const AVATAR_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#dc2626'
]

const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo'
]

const ANTHROPIC_MODELS = [
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229'
]

export default function AIMemberManager({ onClose }: AIMemberManagerProps) {
  const { currentRoom, aiMembers, createAIMember, deleteAIMember } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'anthropic',
    model: 'gpt-4o-mini',
    apiKey: '',
    persona: '',
    systemInstructions: '',
    avatarColor: AVATAR_COLORS[0]
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.apiKey.trim()) return

    setLoading(true)
    try {
      await createAIMember({
        roomId: currentRoom!.id,
        name: formData.name.trim(),
        provider: formData.provider,
        model: formData.model,
        apiKey: formData.apiKey.trim(),
        persona: formData.persona.trim(),
        systemInstructions: formData.systemInstructions.trim(),
        avatarColor: formData.avatarColor
      })

      setFormData({
        name: '',
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: '',
        persona: '',
        systemInstructions: '',
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
      })
      setShowForm(false)
    } catch (error: any) {
      console.error('Error creating AI member:', error)
      alert(error.message || 'Failed to create AI member')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (memberId: number) => {
    if (confirm('Are you sure you want to remove this AI member?')) {
      try {
        await deleteAIMember(memberId)
      } catch (error) {
        console.error('Error deleting AI member:', error)
        alert('Failed to delete AI member')
      }
    }
  }

  const handleProviderChange = (provider: 'openai' | 'anthropic') => {
    setFormData({
      ...formData,
      provider,
      model: provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022'
    })
  }

  const availableModels = formData.provider === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS

  return (
    <div className="fixed inset-0 bg-subtle bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-off-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-border">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-text-primary">AI Members</h2>
          <Button
            variant="unstyled"
            size="icon"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Current Members ({aiMembers.length})
            </h3>

            {aiMembers.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <p>No AI members in this channel yet</p>
                <p className="text-sm mt-1">Add your first AI to start the discussion</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-border transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-text-primary font-semibold flex-shrink-0"
                      style={{ backgroundColor: member.avatar_color }}
                    >
                      {member.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-text-primary">{member.name}</h4>
                        <span className="text-xs px-2 py-1 bg-subtle text-text-secondary rounded">
                          {member.provider} / {member.model}
                        </span>
                      </div>
                      {member.persona && (
                        <p className="text-sm text-text-secondary mb-1">
                          <span className="font-medium">Persona:</span> {member.persona}
                        </p>
                      )}
                      {member.system_instructions && (
                        <p className="text-sm text-text-secondary">
                          <span className="font-medium">Instructions:</span> {member.system_instructions}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="unstyled"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                      className="text-danger-500 hover:text-danger-700 p-2 hover:bg-danger-50 rounded transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!showForm ? (
            <Button
              variant="unstyled"
              fullWidth
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-text-secondary hover:border-selected hover:text-selected transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
              Add AI Member
            </Button>
          ) : (
            <div className="border-2 border-selected rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Add New AI Member</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sarah"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Avatar Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {AVATAR_COLORS.map((color) => (
                        <Button
                          key={color}
                          type="button"
                          variant="unstyled"
                          size="icon"
                          onClick={() => setFormData({ ...formData, avatarColor: color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.avatarColor === color ? 'border-text-primary' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Provider *</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => handleProviderChange(e.target.value as 'openai' | 'anthropic')}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Model *</label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                    >
                      {availableModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    API Key * 
                    <span className="text-text-tertiary font-normal ml-2 text-xs">
                      ({formData.provider === 'openai' ? 'OpenAI' : 'Anthropic'} - stored securely)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder={formData.provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Your API key will be encrypted and stored securely. Get your key from{' '}
                    {formData.provider === 'openai' ? (
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-selected hover:underline">
                        OpenAI Platform
                      </a>
                    ) : (
                      <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-selected hover:underline">
                        Anthropic Console
                      </a>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Persona (optional)</label>
                  <input
                    type="text"
                    value={formData.persona}
                    onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                    placeholder="e.g., Product Manager, Technical Expert, Devil's Advocate"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">System Instructions (optional)</label>
                  <textarea
                    value={formData.systemInstructions}
                    onChange={(e) => setFormData({ ...formData, systemInstructions: e.target.value })}
                    placeholder="Provide specific instructions for how this AI should behave..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-subtle transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="unstyled"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-selected text-text-inverse rounded-lg hover:bg-selected/90 transition-colors disabled:bg-border disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add Member'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <Button
            variant="unstyled"
            fullWidth
            onClick={onClose}
            className="px-4 py-2 bg-subtle text-text-secondary rounded-lg hover:bg-border transition-colors"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
