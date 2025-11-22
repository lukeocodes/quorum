import { create } from 'zustand'

interface User {
  id: number
  username: string
  email: string
  display_name: string
  avatar_color: string
  created_at: string
}

interface Server {
  id: number
  name: string
  description: string
  owner_id: number
  is_public: boolean
  role: string
  owner_username: string
  created_at: string
}

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
  // Auth state
  user: User | null
  authToken: string | null
  
  // Server state
  currentServer: Server | null
  
  // Room state
  rooms: Room[]
  currentRoom: Room | null
  aiMembers: AIMember[]
  messages: Message[]
  summary: string
  roomsWithActivity: Set<number>
  aiThinking: boolean
  mentionableMembers: MentionableMembers | null
  
  // Auth actions
  setUser: (user: User | null) => void
  setAuthToken: (token: string | null) => void
  
  // Server actions
  setCurrentServer: (server: Server | null) => void
  
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
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth state
  user: null,
  authToken: null,
  
  // Server state
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

  // Auth actions
  setUser: (user) => {
    set({ user })
  },

  setAuthToken: (token) => {
    set({ authToken: token })
  },

  // Server actions
  setCurrentServer: (server) => {
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
      get().loadRooms(server.id)
    }
  },

  // Room actions
  loadRooms: async (serverId) => {
    const rooms = await window.electronAPI.getRooms(serverId)
    set({ rooms })
  },

  createRoom: async (serverId, name, description) => {
    const room = await window.electronAPI.createRoom(serverId, name, description)
    set((state) => ({
      rooms: [room, ...state.rooms]
    }))
  },

  selectRoom: async (room) => {
    set({ currentRoom: room, messages: [], mentionableMembers: null })
    await get().loadAIMembers(room.id)
    await get().loadMessages(room.id)
    await get().loadSummary(room.id)
    await get().loadMentionableMembers(room.id)
  },

  archiveRoom: async (roomId) => {
    await window.electronAPI.archiveRoom(roomId)
    set((state) => ({
      rooms: state.rooms.filter(r => r.id !== roomId),
      currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom
    }))
  },

  loadMentionableMembers: async (roomId) => {
    const members = await window.electronAPI.getMentionableMembers(roomId)
    set({ mentionableMembers: members })
  },

  // AI Member actions
  loadAIMembers: async (roomId) => {
    const aiMembers = await window.electronAPI.getAIMembers(roomId)
    set({ aiMembers })
  },

  createAIMember: async (data) => {
    const member = await window.electronAPI.createAIMember(data)
    set((state) => ({
      aiMembers: [...state.aiMembers, member]
    }))
    // Refresh mentionable members list
    const currentRoom = get().currentRoom
    if (currentRoom) {
      await get().loadMentionableMembers(currentRoom.id)
    }
  },

  deleteAIMember: async (memberId) => {
    await window.electronAPI.deleteAIMember(memberId)
    set((state) => ({
      aiMembers: state.aiMembers.filter(m => m.id !== memberId)
    }))
    // Refresh mentionable members list
    const currentRoom = get().currentRoom
    if (currentRoom) {
      await get().loadMentionableMembers(currentRoom.id)
    }
  },

  // Message actions
  loadMessages: async (roomId) => {
    const messages = await window.electronAPI.getMessages(roomId, 100)
    set({ messages })
  },

  sendMessage: async (content, replyToMessageId = null) => {
    const { currentRoom } = get()
    if (!currentRoom) return

    const message = await window.electronAPI.sendMessage(currentRoom.id, content, replyToMessageId)
    set((state) => ({
      messages: [...state.messages, message]
    }))

    // Check if message contains AI mentions (indicated by activity from backend)
    // The backend will queue AIs if they were mentioned
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
    const summary = await window.electronAPI.getSummary(roomId)
    set({ summary })
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
    set({ aiThinking })
  },
}))

// Listen for AI responses and errors
if (window.electronAPI) {
  window.electronAPI.onAIResponse((message: Message) => {
    useAppStore.getState().addMessage(message)
  })

  window.electronAPI.onAIError((data: any) => {
    console.error('AI Error:', data)
    // Clear thinking state if error in current room
    const currentRoom = useAppStore.getState().currentRoom
    if (currentRoom && data.roomId === currentRoom.id) {
      useAppStore.getState().setAIThinking(false)
    }
  })
}
