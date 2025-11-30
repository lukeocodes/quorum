import { useState } from 'react'
import { Button } from '@quorum/app'
import { useAppStore } from '../store/appStore'

interface SetupScreenProps {
  onComplete: () => void
}

export default function SetupScreen({ onComplete }: SetupScreenProps) {
  const { saveSetting } = useAppStore()
  const [formData, setFormData] = useState({
    openai_api_key: '',
    anthropic_api_key: '',
    deepgram_api_key: '',
    elevenlabs_api_key: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate at least one LLM is provided
    if (!formData.openai_api_key && !formData.anthropic_api_key) {
      setError('At least one LLM provider (OpenAI or Anthropic) is required')
      return
    }

    setSaving(true)

    try {
      // Save all non-empty settings
      for (const [key, value] of Object.entries(formData)) {
        if (value.trim()) {
          await saveSetting(key, value.trim())
        }
      }

      onComplete()
    } catch (err) {
      setError('Failed to save settings. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-subtle flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-subtle rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Welcome to Quorum</h1>
          <p className="text-text-secondary">Configure your AI providers to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LLM Providers */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              LLM Providers <span className="text-danger-500">*</span>
            </h2>
            <p className="text-sm text-text-secondary mb-4">At least one is required</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  name="openai_api_key"
                  value={formData.openai_api_key}
                  onChange={handleChange}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  name="anthropic_api_key"
                  value={formData.anthropic_api_key}
                  onChange={handleChange}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Voice Providers */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Voice Providers <span className="text-text-tertiary">(Optional)</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Deepgram API Key <span className="text-xs text-text-tertiary">(STT & TTS)</span>
                </label>
                <input
                  type="password"
                  name="deepgram_api_key"
                  value={formData.deepgram_api_key}
                  onChange={handleChange}
                  placeholder="..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  ElevenLabs API Key <span className="text-xs text-text-tertiary">(TTS)</span>
                </label>
                <input
                  type="password"
                  name="elevenlabs_api_key"
                  value={formData.elevenlabs_api_key}
                  onChange={handleChange}
                  placeholder="..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-selected focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <p className="text-danger-800 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="unstyled"
            fullWidth
            disabled={saving}
            className="bg-selected text-text-inverse py-3 rounded-lg font-semibold hover:bg-selected/90 transition-colors disabled:bg-border disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Continue to Quorum'}
          </Button>
        </form>
      </div>
    </div>
  )
}

