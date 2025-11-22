export interface ElectronAPI {
  // Authentication
  signup: (username: string, email: string, password: string, displayName?: string) => Promise<{ user: any, token: string }>
  login: (usernameOrEmail: string, password: string) => Promise<{ user: any, token: string }>
  logout: (token: string) => Promise<{ success: boolean }>
  validateSession: (token: string) => Promise<any>
  getCurrentUser: () => Promise<{ user: any, token: string } | null>

  // Servers
  createServer: (name: string, description: string, isPublic: boolean) => Promise<any>
  getUserServers: () => Promise<any[]>
  getServer: (serverId: number) => Promise<any>
  updateServer: (serverId: number, updates: any) => Promise<any>
  deleteServer: (serverId: number) => Promise<{ success: boolean }>
  getServerMembers: (serverId: number) => Promise<any[]>
  createInvite: (serverId: number, maxUses?: number, expiresIn?: number) => Promise<any>
  joinServerWithInvite: (inviteCode: string) => Promise<any>
  joinPublicServer: (serverId: number) => Promise<any>
  leaveServer: (serverId: number) => Promise<{ success: boolean }>
  getPublicServers: (limit?: number, offset?: number) => Promise<any[]>
  shareChannel: (roomId: number, targetServerId: number) => Promise<any>

  // Rooms
  getRooms: (serverId: number) => Promise<any[]>
  createRoom: (serverId: number, name: string, description: string) => Promise<any>
  archiveRoom: (roomId: number) => Promise<{ success: boolean }>
  getMentionableMembers: (roomId: number) => Promise<{ users: any[], aiMembers: any[] }>

  // AI Members
  getAIMembers: (roomId: number) => Promise<any[]>
  createAIMember: (data: any) => Promise<any>
  deleteAIMember: (memberId: number) => Promise<{ success: boolean }>

  // Messages
  getMessages: (roomId: number, limit: number) => Promise<any[]>
  sendMessage: (roomId: number, content: string, replyToMessageId?: number | null) => Promise<any>

  // AI Operations
  generateAIResponse: (data: any) => Promise<string>
  updateSummary: (roomId: number) => Promise<{ success: boolean }>
  getSummary: (roomId: number) => Promise<string>

  // STT/TTS
  transcribeAudio: (audioData: Buffer) => Promise<string>
  synthesizeSpeech: (text: string, provider: string) => Promise<Buffer>

  // Queue status
  getQueueStatus: () => Promise<any>

  // Event listeners
  onMessage: (callback: (message: any) => void) => void
  onAIResponse: (callback: (data: any) => void) => void
  onAIError: (callback: (data: any) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

