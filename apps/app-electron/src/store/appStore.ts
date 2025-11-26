import { create } from 'zustand'
import { UserSession, Server as ServerType } from '../types/electron'

interface User {
  id: number
  username: string
  email: string
  display_name: string
  avatar_color: string
  created_at: string
}

// Note: Server type is now imported from '../types/electron' as ServerType

interface Room {
  id: number
  server_id: number
  name: string
  description: string
  archived: boolean
  is_shared?: boolean
  created_at: string
  updated_at: string
}

interface AIMember {
  id: number
  room_id: number
  name: string
  provider: 'openai' | 'anthropic'
  model: string
  persona: string
  system_instructions: string
  avatar_color: string
  created_at: string
  updated_at: string
}

interface Message {
  id: number
  room_id: number
  member_type: 'user' | 'ai'
  member_id: number
  content: string
  created_at: string
  reply_to_message_id?: number
  // Joined data
  member_name?: string
  member_display_name?: string
  member_avatar_color?: string
  // Reply data
  reply_to_content?: string
  reply_to_member_type?: 'user' | 'ai'
  reply_to_member_name?: string
}

interface MentionableMembers {
  users: Array<{ id: number; username: string; display_name: string; avatar_color: string }>
  aiMembers: Array<{ id: number; name: string; avatar_color: string }>
}

interface AppState {
  // Session state
  activeSession: UserSession | null

  // Auth state (from active session)
  user: User | null
  authToken: string | null

  // Server state (from API)
  servers: ServerType[]
  currentServer: ServerType | null

  // Room state
  rooms: Room[]
  currentRoom: Room | null
  aiMembers: AIMember[]
  messages: Message[]
  summary: string
  roomsWithActivity: Set<number>
  aiThinking: boolean
  mentionableMembers: MentionableMembers | null

  // Context Menu state
  contextMenuOpen: boolean
  contextMenuContent: 'channel-details' | 'user-profile' | null
  contextMenuWidth: number

  // Session actions
  setActiveSession: (session: UserSession | null) => void
  fetchServersForSession: (sessionId: number) => Promise<void>

  // Auth actions
  setUser: (user: User | null) => void
  setAuthToken: (token: string | null) => void

  // Server actions
  setServers: (servers: ServerType[]) => void
  setCurrentServer: (server: ServerType | null) => Promise<void>
  updateServerOrder: (oldIndex: number, newIndex: number) => Promise<void>

  // Room actions
  loadRooms: (serverId: number) => Promise<void>
  createRoom: (serverId: number, name: string, description: string) => Promise<void>
  selectRoom: (room: Room) => Promise<void>
  archiveRoom: (roomId: number) => Promise<void>
  loadMentionableMembers: (roomId: number) => Promise<void>

  // AI Member actions
  loadAIMembers: (roomId: number) => Promise<void>
  createAIMember: (data: any) => Promise<void>
  deleteAIMember: (memberId: number) => Promise<void>

  // Message actions
  loadMessages: (roomId: number) => Promise<void>
  sendMessage: (content: string, replyToMessageId?: number | null) => Promise<void>
  addMessage: (message: Message) => void
  loadSummary: (roomId: number) => Promise<void>

  // Activity tracking
  setRoomActivity: (roomId: number, active: boolean) => void
  setAIThinking: (thinking: boolean) => void

  // Context Menu actions
  openContextMenu: (content: 'channel-details' | 'user-profile') => void
  closeContextMenu: () => void
  setContextMenuWidth: (width: number) => void
}

// API URLs
// api-core: auth, servers, discovery (port 3000)
// api-server: channels, messages, ai, sse (port 3001)
// Note: In the future, api-server URL may vary per quorum server
const API_CORE_URL = 'http://localhost:3000'
const API_SERVER_URL = 'http://localhost:3001'

// Helper function to get API credentials for the current server
function getApiCredentials(state: AppState): { apiUrl: string; serverApiUrl: string; authToken: string } | null {
  // Prefer the current server's session info if available
  if (state.currentServer?.sessionAuthToken) {
    return {
      apiUrl: state.currentServer.sessionApiUrl || API_CORE_URL,
      serverApiUrl: API_SERVER_URL,
      authToken: state.currentServer.sessionAuthToken,
    }
  }

  // Fall back to active session
  if (state.activeSession?.authToken) {
    return {
      apiUrl: state.activeSession.apiUrl || API_CORE_URL,
      serverApiUrl: API_SERVER_URL,
      authToken: state.activeSession.authToken,
    }
  }

  return null
}

export const useAppStore = create<AppState>((set, get) => ({
  // Session state
  activeSession: null,

  // Auth state
  user: null,
  authToken: null,

  // Server state
  servers: [],
  currentServer: null,

  // Room state
  rooms: [],
  currentRoom: null,
  aiMembers: [],
  messages: [],
  summary: '',
  roomsWithActivity: new Set(),
  aiThinking: false,
  mentionableMembers: null,

  // Context Menu state
  contextMenuOpen: false,
  contextMenuContent: null,
  contextMenuWidth: 400,

  // Session actions
  setActiveSession: (session) => {
    console.log('🔄 setActiveSession called with:', session)
    set({
      activeSession: session,
      // Set user and auth token from session
      user: session ? {
        id: session.userId,
        username: session.username,
        email: session.email,
        display_name: session.displayName,
        avatar_color: session.avatarColor,
        created_at: '',
      } : null,
      authToken: session?.authToken || null,
      // Clear room state when switching sessions, but keep servers from all sessions
      rooms: [],
      currentRoom: null,
      aiMembers: [],
      messages: [],
      summary: '',
      roomsWithActivity: new Set(),
      mentionableMembers: null,
    })

    // Fetch servers from ALL sessions (not just the active one)
    console.log('📡 Triggering fetchServersForSession to refresh all servers')
    get().fetchServersForSession(session?.id || 0)
  },

  fetchServersForSession: async (sessionId) => {
    try {
      console.log('🔍 Fetching servers from ALL sessions')
      const result = await window.electronAPI.getAllServers()
      console.log('📦 Servers result:', result)

      if (result.success) {
        console.log(`✅ Found ${result.data.length} total servers across all users`)
        if (result.data.length === 0) {
          console.log('ℹ️  No servers added to desktop yet. Add servers via the web app.')
        }
        set({ servers: result.data })

        // Auto-select first server if none selected
        const currentServer = get().currentServer
        if (!currentServer && result.data.length > 0) {
          console.log('📍 Auto-selecting first server:', result.data[0].name)
          get().setCurrentServer(result.data[0])
        }
      } else {
        console.error('❌ Failed to fetch servers')
      }
    } catch (error) {
      console.error('❌ Error fetching servers:', error)
      set({ servers: [] })
    }
  },

  // Auth actions
  setUser: (user) => {
    set({ user })
  },

  setAuthToken: (token) => {
    set({ authToken: token })
  },

  // Server actions
  setServers: (servers) => {
    set({ servers })
  },

  setCurrentServer: async (server) => {
    set({
      currentServer: server,
      rooms: [],
      currentRoom: null,
      aiMembers: [],
      messages: [],
      summary: ''
    })

    // Load rooms for the server
    if (server) {
      await get().loadRooms(server.id)

      // After rooms are loaded, try to load the last viewed room
      const credentials = getApiCredentials(get())
      if (credentials) {
        try {
          // Get last viewed channel ID
          const response = await fetch(`${credentials.apiUrl}/servers/${server.id}/last-viewed-channel`, {
            headers: {
              'Authorization': `Bearer ${credentials.authToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            const lastViewedRoomId = data.data?.channel_id

            const { rooms } = get()
            let roomToSelect = null

            if (lastViewedRoomId) {
              // Find the last viewed room
              roomToSelect = rooms.find(r => r.id === lastViewedRoomId)
            }

            // If no last viewed room or room not found, default to "general"
            if (!roomToSelect) {
              roomToSelect = rooms.find(r => r.name.toLowerCase() === 'general')
            }

            // If still no room, select the first available room
            if (!roomToSelect && rooms.length > 0) {
              roomToSelect = rooms[0]
            }

            // Select the room
            if (roomToSelect) {
              await get().selectRoom(roomToSelect)
            }
          }
        } catch (error) {
          console.error('Error loading last viewed room:', error)
          // Fall back to selecting general or first room
          const { rooms } = get()
          const generalRoom = rooms.find(r => r.name.toLowerCase() === 'general')
          const roomToSelect = generalRoom || rooms[0]
          if (roomToSelect) {
            await get().selectRoom(roomToSelect)
          }
        }
      }
    }
  },

  updateServerOrder: async (oldIndex, newIndex) => {
    const { activeSession, servers } = get()
    if (!activeSession) {
      console.error('No active session when updating server order')
      return
    }

    // Optimistically update UI
    const newServers = [...servers]
    const [movedServer] = newServers.splice(oldIndex, 1)
    newServers.splice(newIndex, 0, movedServer)
    set({ servers: newServers })

    // Persist to database - update all server positions
    try {
      for (let i = 0; i < newServers.length; i++) {
        await window.electronAPI.updateServerOrder(activeSession.id, newServers[i].id, i)
      }
      console.log('Server order updated successfully')
    } catch (error) {
      console.error('Error updating server order:', error)
      // Revert on error
      set({ servers })
    }
  },

  // Room actions
  loadRooms: async (serverId) => {
    console.log('loadRooms called for serverId:', serverId)
    const credentials = getApiCredentials(get())

    if (!credentials) {
      console.error('No API credentials available for loading rooms')
      return
    }

    console.log('Using server API:', {
      serverApiUrl: credentials.serverApiUrl,
      hasToken: !!credentials.authToken,
    })

    try {
      const url = `${credentials.serverApiUrl}/servers/${serverId}/channels`
      console.log('Fetching channels from:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Channels response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`Failed to fetch channels: ${response.status}`)
      }

      const data = await response.json()
      console.log('Channels data from API:', data)
      console.log('Channels array:', data.data?.channels)
      console.log('Number of channels:', data.data?.channels?.length || 0)

      set({ rooms: data.data?.channels || [] })
    } catch (error) {
      console.error('Error loading channels:', error)
      set({ rooms: [] })
    }
  },

  createRoom: async (serverId, name, description) => {
    const credentials = getApiCredentials(get())
    if (!credentials) {
      console.error('No API credentials available')
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/servers/${serverId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create room')
      }

      const data = await response.json()
      const room = data.data?.room

      // Only add the room if it exists
      if (room) {
        set((state) => ({
          rooms: [room, ...state.rooms]
        }))
      } else {
        console.error('Room object not returned from API:', data)
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      throw error
    }
  },

  selectRoom: async (room) => {
    set({ currentRoom: room, messages: [], mentionableMembers: null })

    // Update last viewed channel on the server
    const credentials = getApiCredentials(get())
    const { currentServer } = get()
    if (credentials && currentServer) {
      try {
        await fetch(`${credentials.apiUrl}/servers/${currentServer.id}/last-viewed-channel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${credentials.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channel_id: room.id }),
        })
      } catch (error) {
        console.error('Error updating last viewed room:', error)
        // Don't block room selection if this fails
      }
    }

    await get().loadAIMembers(room.id)
    await get().loadMessages(room.id)
    // Summary and mentionable members endpoints don't exist yet - skip for now
    // await get().loadSummary(room.id)
    // await get().loadMentionableMembers(room.id)
  },

  archiveRoom: async (roomId) => {
    const credentials = getApiCredentials(get())
    if (!credentials) {
      console.error('No API credentials available')
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/channels/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to archive room')
      }

      set((state) => ({
        rooms: state.rooms.filter(r => r.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom
      }))
    } catch (error) {
      console.error('Error archiving room:', error)
      throw error
    }
  },

  loadMentionableMembers: async (roomId) => {
    const credentials = getApiCredentials(get())
    if (!credentials) {
      console.error('No API credentials available')
      return
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/channels/${roomId}/mentionable-members`, {
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch mentionable members')
      }

      const data = await response.json()
      set({ mentionableMembers: data.data || { users: [], aiMembers: [] } })
    } catch (error) {
      console.error('Error loading mentionable members:', error)
      set({ mentionableMembers: { users: [], aiMembers: [] } })
    }
  },

  // AI Member actions
  loadAIMembers: async (roomId) => {
    const credentials = getApiCredentials(get())
    if (!credentials) {
      console.error('No API credentials available')
      return
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/channels/${roomId}/ai-members`, {
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI members')
      }

      const data = await response.json()
      console.log('AI members response:', data)
      // API returns { data: { ai_members: [...] } }
      set({ aiMembers: data.data?.ai_members || [] })
    } catch (error) {
      console.error('Error loading AI members:', error)
      set({ aiMembers: [] })
    }
  },

  createAIMember: async (data) => {
    const credentials = getApiCredentials(get())
    const { currentRoom } = get()
    if (!credentials || !currentRoom) {
      console.error('No API credentials or current room')
      throw new Error('Not authenticated or no room selected')
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/channels/${currentRoom.id}/ai-members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create AI member')
      }

      const responseData = await response.json()
      const member = responseData.data?.ai_member

      set((state) => ({
        aiMembers: [...state.aiMembers, member]
      }))

      // Refresh mentionable members list
      if (currentRoom) {
        await get().loadMentionableMembers(currentRoom.id)
      }
    } catch (error) {
      console.error('Error creating AI member:', error)
      throw error
    }
  },

  deleteAIMember: async (memberId) => {
    const credentials = getApiCredentials(get())
    if (!credentials) {
      console.error('No API credentials available')
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/ai-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete AI member')
      }

      set((state) => ({
        aiMembers: state.aiMembers.filter(m => m.id !== memberId)
      }))

      // Refresh mentionable members list
      const currentRoom = get().currentRoom
      if (currentRoom) {
        await get().loadMentionableMembers(currentRoom.id)
      }
    } catch (error) {
      console.error('Error deleting AI member:', error)
      throw error
    }
  },

  // Message actions
  loadMessages: async (roomId) => {
    const credentials = getApiCredentials(get())
    if (!credentials) {
      console.error('No API credentials available')
      return
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/channels/${roomId}/messages?limit=100`, {
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      console.log('Messages response:', data)
      // API returns { data: { data: [...], pagination: {...} } }
      const messages = data.data?.data || []
      console.log('Messages array:', messages, 'Count:', messages.length)
      set({ messages })
    } catch (error) {
      console.error('Error loading messages:', error)
      set({ messages: [] })
    }
  },

  sendMessage: async (content, replyToMessageId = null) => {
    const credentials = getApiCredentials(get())
    const { currentRoom } = get()
    if (!currentRoom || !credentials) return

    try {
      const response = await fetch(`${credentials.serverApiUrl}/channels/${currentRoom.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          reply_to_message_id: replyToMessageId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      set((state) => ({
        messages: [...state.messages, data.data]
      }))

      // Check if message contains AI mentions (indicated by activity from backend)
      // The backend will queue AIs if they were mentioned
    } catch (error) {
      console.error('Error sending message:', error)
    }
  },

  addMessage: (message) => {
    const { currentRoom } = get()

    set((state) => {
      // Only add if message belongs to current room OR update activity
      if (currentRoom && message.room_id === currentRoom.id) {
        return {
          messages: [...state.messages, message]
        }
      }
      return state
    })

    // If it's an AI message in current room, mark as activity
    if (currentRoom && message.room_id === currentRoom.id && message.member_type === 'ai') {
      get().setAIThinking(false)
      get().setRoomActivity(currentRoom.id, false)
    } else if (message.room_id !== currentRoom?.id) {
      // Message in a different room - mark that room as having activity
      get().setRoomActivity(message.room_id, true)
    }
  },

  loadSummary: async (roomId) => {
    const credentials = getApiCredentials(get())
    if (!credentials) {
      console.error('No API credentials available')
      return
    }

    try {
      const response = await fetch(`${credentials.serverApiUrl}/channels/${roomId}/summary`, {
        headers: {
          'Authorization': `Bearer ${credentials.authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Summary might not exist, that's OK
        set({ summary: '' })
        return
      }

      const data = await response.json()
      set({ summary: data.data || '' })
    } catch (error) {
      console.error('Error loading summary:', error)
      set({ summary: '' })
    }
  },

  // Activity tracking
  setRoomActivity: (roomId, active) => {
    set((state) => {
      const newActivity = new Set(state.roomsWithActivity)
      if (active) {
        newActivity.add(roomId)
      } else {
        newActivity.delete(roomId)
      }
      return { roomsWithActivity: newActivity }
    })
  },

  setAIThinking: (thinking) => {
    set({ aiThinking: thinking })
  },

  // Context Menu actions
  openContextMenu: (content) => {
    set({ contextMenuOpen: true, contextMenuContent: content })
  },

  closeContextMenu: () => {
    set({ contextMenuOpen: false })
  },

  setContextMenuWidth: (width) => {
    set({ contextMenuWidth: width })
  },
}))

// Note: AI processing now happens via the API, not locally in Electron
// Event listeners for AI responses have been removed since the API handles all AI operations
