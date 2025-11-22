const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Authentication
  signup: (username, email, password, displayName) =>
    ipcRenderer.invoke("auth:signup", username, email, password, displayName),
  login: (usernameOrEmail, password) =>
    ipcRenderer.invoke("auth:login", usernameOrEmail, password),
  logout: (token) => ipcRenderer.invoke("auth:logout", token),
  validateSession: (token) => ipcRenderer.invoke("auth:validate", token),
  getCurrentUser: () => ipcRenderer.invoke("auth:current-user"),

  // Servers
  createServer: (name, description, isPublic) =>
    ipcRenderer.invoke("servers:create", name, description, isPublic),
  getUserServers: () => ipcRenderer.invoke("servers:get-user-servers"),
  getServer: (serverId) => ipcRenderer.invoke("servers:get", serverId),
  updateServer: (serverId, updates) =>
    ipcRenderer.invoke("servers:update", serverId, updates),
  deleteServer: (serverId) => ipcRenderer.invoke("servers:delete", serverId),
  getServerMembers: (serverId) =>
    ipcRenderer.invoke("servers:get-members", serverId),
  createInvite: (serverId, maxUses, expiresIn) =>
    ipcRenderer.invoke("servers:create-invite", serverId, maxUses, expiresIn),
  joinServerWithInvite: (inviteCode) =>
    ipcRenderer.invoke("servers:join-with-invite", inviteCode),
  joinPublicServer: (serverId) =>
    ipcRenderer.invoke("servers:join-public", serverId),
  leaveServer: (serverId) => ipcRenderer.invoke("servers:leave", serverId),
  getPublicServers: (limit, offset) =>
    ipcRenderer.invoke("servers:get-public", limit, offset),
  shareChannel: (roomId, targetServerId) =>
    ipcRenderer.invoke("servers:share-channel", roomId, targetServerId),

  // Rooms
  getRooms: (serverId) => ipcRenderer.invoke("rooms:get", serverId),
  createRoom: (serverId, name, description) =>
    ipcRenderer.invoke("rooms:create", serverId, name, description),
  archiveRoom: (roomId) => ipcRenderer.invoke("rooms:archive", roomId),
  getMentionableMembers: (roomId) =>
    ipcRenderer.invoke("rooms:get-mentionable-members", roomId),

  // AI Members
  getAIMembers: (roomId) => ipcRenderer.invoke("ai-members:get", roomId),
  createAIMember: (data) => ipcRenderer.invoke("ai-members:create", data),
  deleteAIMember: (memberId) =>
    ipcRenderer.invoke("ai-members:delete", memberId),

  // Messages
  getMessages: (roomId, limit) =>
    ipcRenderer.invoke("messages:get", roomId, limit),
  sendMessage: (roomId, content, replyToMessageId) =>
    ipcRenderer.invoke("messages:send", roomId, content, replyToMessageId),

  // AI Operations
  generateAIResponse: (data) =>
    ipcRenderer.invoke("ai:generate-response", data),
  updateSummary: (roomId) => ipcRenderer.invoke("ai:update-summary", roomId),
  getSummary: (roomId) => ipcRenderer.invoke("ai:get-summary", roomId),

  // STT/TTS
  transcribeAudio: (audioData) =>
    ipcRenderer.invoke("stt:transcribe", audioData),
  synthesizeSpeech: (text, provider) =>
    ipcRenderer.invoke("tts:synthesize", text, provider),

  // Queue status
  getQueueStatus: () => ipcRenderer.invoke("queue:status"),

  // Event listeners
  onMessage: (callback) => {
    ipcRenderer.on("message:new", (event, message) => callback(message));
  },
  onAIResponse: (callback) => {
    ipcRenderer.on("ai:response", (event, data) => callback(data));
  },
  onAIError: (callback) => {
    ipcRenderer.on("ai:error", (event, data) => callback(data));
  },
});
