import { useState, useEffect } from 'react'
import { useSessionStore } from '../store/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faServer, faEdit } from '@fortawesome/free-solid-svg-icons'
import { Button } from './primitives'

interface MergedProfile {
  user_id: number
  server_id: number
  username: string
  email: string
  display_name: string | null
  avatar_color: string
  full_name: string | null
  title: string | null
  pronouns: string | null
  timezone: string | null
  overrides: {
    display_name: boolean
    full_name: boolean
    title: boolean
    pronouns: boolean
    timezone: boolean
  }
}

interface UserProfileProps {
  userId?: number // If provided, shows another user's profile. Otherwise shows own profile
}

export default function UserProfile({ userId }: UserProfileProps) {
  const sessionStore = useSessionStore()
  const { activeSession, currentServer } = sessionStore()
  
  const [profile, setProfile] = useState<MergedProfile | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null) // Base user profile
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'user' | 'server'>('server')
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state for editing
  const [displayName, setDisplayName] = useState('')
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [timezone, setTimezone] = useState('')
  const [saving, setSaving] = useState(false)

  const isOwnProfile = !userId || userId === activeSession?.userId
  const viewingUserId = userId || activeSession?.userId

  useEffect(() => {
    if (!activeSession || !currentServer) {
      setError('No active session or server')
      setLoading(false)
      return
    }
    loadProfile()
  }, [activeSession, currentServer, userId])

  async function loadProfile() {
    if (!activeSession || !currentServer || !viewingUserId) return

    try {
      setLoading(true)
      setError(null)

      // Derive API URLs from session's apiUrl (assumes standard ports)
      // apiUrl is typically API_CORE_URL (port 3000)
      // API_USER_URL is port 3002, API_SERVER_URL is port 3001
      const baseUrl = activeSession.apiUrl || 'http://localhost:3000'
      const userApiUrl = baseUrl.replace(':3000', ':3002').replace('api-core', 'api-user')
      const serverApiUrl = baseUrl.replace(':3000', ':3001').replace('api-core', 'api-server')
      
      if (isOwnProfile) {
        // Load both user profile and server profile
        const [userResponse, serverResponse] = await Promise.all([
          fetch(`${userApiUrl}/users/me`, {
            headers: {
              'Authorization': `Bearer ${activeSession.authToken}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${serverApiUrl}/servers/${currentServer.id}/profiles/me`, {
            headers: {
              'Authorization': `Bearer ${activeSession.authToken}`,
              'Content-Type': 'application/json',
            },
          }),
        ])

        if (!userResponse.ok || !serverResponse.ok) {
          throw new Error('Failed to load profile')
        }

        const userData = await userResponse.json()
        const serverData = await serverResponse.json()

        if (userData.success) setUserProfile(userData.data)
        if (serverData.success) {
          setProfile(serverData.data)
          // Initialize form state
          setDisplayName(serverData.data.display_name || '')
          setFullName(serverData.data.full_name || '')
          setTitle(serverData.data.title || '')
          setPronouns(serverData.data.pronouns || '')
          setTimezone(serverData.data.timezone || '')
        }
      } else {
        // Load other user's server profile
        const response = await fetch(`${serverApiUrl}/servers/${currentServer.id}/profiles/${viewingUserId}`, {
          headers: {
            'Authorization': `Bearer ${activeSession.authToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()
        if (data.success) {
          setProfile(data.data)
        } else {
          throw new Error(data.message || 'Failed to load profile')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!activeSession || !currentServer) return

    setSaving(true)
    setError(null)

    try {
      // Derive API URLs from session's apiUrl
      const baseUrl = activeSession.apiUrl || 'http://localhost:3000'
      const userApiUrl = baseUrl.replace(':3000', ':3002').replace('api-core', 'api-user')
      const serverApiUrl = baseUrl.replace(':3000', ':3001').replace('api-core', 'api-server')
      
      if (activeTab === 'user') {
        // Update user profile
        const response = await fetch(`${userApiUrl}/users/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${activeSession.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            display_name: displayName || null,
            full_name: fullName || null,
            title: title || null,
            pronouns: pronouns || null,
            timezone: timezone || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to update profile')
        }

        const data = await response.json()
        if (data.success) {
          setUserProfile(data.data)
        }
      } else {
        // Update server profile
        const response = await fetch(`${serverApiUrl}/servers/${currentServer.id}/profiles/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${activeSession.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            display_name: displayName || null,
            full_name: fullName || null,
            title: title || null,
            pronouns: pronouns || null,
            timezone: timezone || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to update profile')
        }

        const data = await response.json()
        if (data.success) {
          setProfile(data.data)
        }
      }

      setIsEditing(false)
      await loadProfile() // Reload to get fresh data
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function getInitials(prof: MergedProfile | null): string {
    if (!prof) return '?'
    if (prof.full_name) {
      const parts = prof.full_name.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return prof.full_name[0].toUpperCase()
    }
    if (prof.display_name) {
      return prof.display_name[0].toUpperCase()
    }
    return prof.username[0].toUpperCase()
  }

  function getDisplayProfile(): MergedProfile | null {
    if (isOwnProfile && activeTab === 'user' && userProfile) {
      // Convert user profile to merged profile format
      return {
        user_id: userProfile.id,
        server_id: currentServer?.id || 0,
        username: userProfile.username,
        email: userProfile.email,
        display_name: userProfile.display_name,
        avatar_color: userProfile.avatar_color,
        full_name: userProfile.full_name,
        title: userProfile.title,
        pronouns: userProfile.pronouns,
        timezone: userProfile.timezone,
        overrides: {
          display_name: false,
          full_name: false,
          title: false,
          pronouns: false,
          timezone: false,
        },
      }
    }
    return profile
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-selected mb-4"></div>
          <p className="text-text-tertiary">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-danger-50 border-l-4 border-danger-500 p-4">
          <p className="text-sm text-danger-800">{error}</p>
        </div>
      </div>
    )
  }

  const displayProfile = getDisplayProfile()
  if (!displayProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-tertiary">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Tabs (only for own profile) */}
      {isOwnProfile && !isEditing && (
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'user'
                ? 'text-text-primary border-b-2 border-selected bg-subtle'
                : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
            }`}
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            User Profile
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'server'
                ? 'text-text-primary border-b-2 border-selected bg-subtle'
                : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
            }`}
          >
            <FontAwesomeIcon icon={faServer} className="mr-2" />
            Server Profile
            {profile?.overrides && Object.values(profile.overrides).some(v => v) && (
              <span className="ml-2 text-xs text-selected">•</span>
            )}
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl flex-shrink-0"
            style={{ backgroundColor: displayProfile.avatar_color }}
          >
            {getInitials(displayProfile)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-text-primary truncate">
              {displayProfile.full_name || displayProfile.display_name || displayProfile.username}
            </h2>
            {displayProfile.display_name && (
              <p className="text-text-secondary">@{displayProfile.username}</p>
            )}
            {displayProfile.title && (
              <p className="text-text-secondary mt-1">{displayProfile.title}</p>
            )}
          </div>
          {isOwnProfile && !isEditing && (
            <Button
              variant="unstyled"
              onClick={() => {
                setIsEditing(true)
                // Initialize form based on active tab
                if (activeTab === 'user' && userProfile) {
                  setDisplayName(userProfile.display_name || '')
                  setFullName(userProfile.full_name || '')
                  setTitle(userProfile.title || '')
                  setPronouns(userProfile.pronouns || '')
                  setTimezone(userProfile.timezone || '')
                } else if (activeTab === 'server' && profile) {
                  setDisplayName(profile.display_name || '')
                  setFullName(profile.full_name || '')
                  setTitle(profile.title || '')
                  setPronouns(profile.pronouns || '')
                  setTimezone(profile.timezone || '')
                }
              }}
              className="p-2 text-text-secondary hover:bg-subtle rounded-lg transition-colors"
              title="Edit profile"
            >
              <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Profile Details */}
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Username
              </label>
              <p className="text-text-primary">{displayProfile.username}</p>
            </div>

            {isOwnProfile && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Email
                </label>
                <p className="text-text-primary">{displayProfile.email}</p>
              </div>
            )}

            {displayProfile.display_name && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Display Name
                </label>
                <p className="text-text-primary">{displayProfile.display_name}</p>
              </div>
            )}

            {displayProfile.full_name && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Full Name
                </label>
                <p className="text-text-primary">{displayProfile.full_name}</p>
              </div>
            )}

            {displayProfile.title && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Title
                </label>
                <p className="text-text-primary">{displayProfile.title}</p>
              </div>
            )}

            {displayProfile.pronouns && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Pronouns
                </label>
                <p className="text-text-primary">{displayProfile.pronouns}</p>
              </div>
            )}

            {displayProfile.timezone && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Timezone
                </label>
                <p className="text-text-primary">{displayProfile.timezone}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* Edit Tabs */}
            {isOwnProfile && (
              <div className="flex border-b border-border mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('user')
                    // Reset form to user profile values
                    if (userProfile) {
                      setDisplayName(userProfile.display_name || '')
                      setFullName(userProfile.full_name || '')
                      setTitle(userProfile.title || '')
                      setPronouns(userProfile.pronouns || '')
                      setTimezone(userProfile.timezone || '')
                    }
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'user'
                      ? 'text-text-primary border-b-2 border-selected'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  User Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('server')
                    // Reset form to server profile values
                    if (profile) {
                      setDisplayName(profile.display_name || '')
                      setFullName(profile.full_name || '')
                      setTitle(profile.title || '')
                      setPronouns(profile.pronouns || '')
                      setTimezone(profile.timezone || '')
                    }
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'server'
                      ? 'text-text-primary border-b-2 border-selected'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Server Profile
                </button>
              </div>
            )}

            <div>
              <label htmlFor="display_name" className="block text-xs font-medium text-text-primary mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="full_name" className="block text-xs font-medium text-text-primary mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-xs font-medium text-text-primary mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="pronouns" className="block text-xs font-medium text-text-primary mb-1">
                Pronouns
              </label>
              <input
                type="text"
                id="pronouns"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-xs font-medium text-text-primary mb-1">
                Timezone (IANA format)
              </label>
              <input
                type="text"
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g., Europe/London"
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent text-sm"
              />
              <p className="mt-1 text-xs text-text-secondary">IANA timezone identifier</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => {
                  setIsEditing(false)
                  loadProfile() // Reset form
                }}
                className="px-4 py-2 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-selected text-text-inverse rounded-md hover:bg-selected/90 text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

