export interface UserSession {
  id: number
  userId: number
  username: string
  email: string
  displayName: string
  avatarColor: string
  authToken: string
  apiUrl: string
  isActive: boolean
}

export interface Server {
  id: number
  name: string
  description: string
  isPublic: boolean
  role: string
  roomCount: number
  memberCount: number
  addedAt: string
  lastAccessedAt: string
  createdAt: string
  updatedAt: string
  // Session info (included when fetching from all sessions)
  sessionId?: number
  sessionUserId?: number
  sessionUsername?: string
  sessionAuthToken?: string
  sessionApiUrl?: string
}

export interface ServerConnectionData {
  server: {
    id: number
    name: string
    description?: string
    isPublic: boolean
    role: string
  }
  user: {
    id: number
    username: string
    email: string
    displayName: string
    avatarColor: string
  }
  authToken: string
  apiUrl: string
}

export interface ChannelSection {
  id: string
  name: string
  type: 'channels'
  channelIds: number[]
  collapsed: boolean
  isDefault: boolean
}

export interface ElectronAPI {
  // System
  openExternal: (url: string) => Promise<{ success: boolean }>

  // Sessions (Multi-Account Support - Local SQLite)
  getAllSessions: () => Promise<{ success: boolean; data: UserSession[] }>
  getActiveSession: () => Promise<{ success: boolean; data: UserSession | null }>
  setActiveSession: (sessionId: number) => Promise<{ success: boolean; data?: UserSession; error?: string }>
  removeSession: (sessionId: number) => Promise<{ success: boolean; error?: string }>
  
  // Servers (fetched from API via session manager cache)
  getServersForSession: (sessionId: number) => Promise<{ success: boolean; data: Server[] }>
  getAllServers: () => Promise<{ success: boolean; data: Server[] }>
  updateServerOrder: (sessionId: number, serverId: number, newOrder: number) => Promise<{ success: boolean; error?: string }>
  removeServer: (serverId: number) => Promise<{ success: boolean; error?: string }>
  refreshServers: (sessionId: number) => Promise<{ success: boolean; data: Server[] }>
  openAddServerFlow: () => Promise<{ success: boolean }>

  // Channel sections (Local SQLite for organizing channels - server-specific)
  loadSections: (sessionId: number, serverId: number) => Promise<{ success: boolean; data?: ChannelSection[]; error?: string }>
  saveSections: (sessionId: number, serverId: number, sections: ChannelSection[]) => Promise<{ success: boolean; error?: string }>

  // UI preferences (Local SQLite for UI settings)
  // App-level preferences (e.g., sidebar width) - not tied to a specific server
  loadAppUIPreference: (sessionId: number, preferenceKey: string) => Promise<{ success: boolean; data?: string | null; error?: string }>
  saveAppUIPreference: (sessionId: number, preferenceKey: string, preferenceValue: string) => Promise<{ success: boolean; error?: string }>
  // Server-level preferences (e.g., theme overrides) - tied to a specific server
  loadServerUIPreference: (sessionId: number, serverId: number, preferenceKey: string) => Promise<{ success: boolean; data?: string | null; error?: string }>
  saveServerUIPreference: (sessionId: number, serverId: number, preferenceKey: string, preferenceValue: string) => Promise<{ success: boolean; error?: string }>

  // Event listeners
  onSessionAdded: (callback: (data: { session: UserSession; serverId?: number }) => void) => void
  onSessionChanged: (callback: (data: { session: UserSession }) => void) => void
  onSessionRemoved: (callback: (data: { sessionId: number }) => void) => void
  onServerRemoved: (callback: (data: { serverId: number }) => void) => void
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

