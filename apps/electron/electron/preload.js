const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use ipcRenderer
// Note: The Electron app uses the API for most operations. IPC is only used for:
// - Session management (local SQLite)
// - Opening external URLs (system integration)
// - Event passing between main and renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // System
  openExternal: (url) => ipcRenderer.invoke("system:open-external", url),

  // Sessions (local SQLite management)
  getAllSessions: () => ipcRenderer.invoke("sessions:get-all"),
  getActiveSession: () => ipcRenderer.invoke("sessions:get-active"),
  setActiveSession: (sessionId) => ipcRenderer.invoke("sessions:set-active", sessionId),
  removeSession: (sessionId) => ipcRenderer.invoke("sessions:remove", sessionId),

  // Servers (fetched from API via session manager)
  getServersForSession: (sessionId) => ipcRenderer.invoke("servers:get-for-session", sessionId),
  getAllServers: () => ipcRenderer.invoke("servers:get-all"),
  updateServerOrder: (sessionId, serverId, newOrder) => ipcRenderer.invoke("servers:update-order", sessionId, serverId, newOrder),
  removeServer: (serverId) => ipcRenderer.invoke("servers:remove", serverId),
  refreshServers: (sessionId) => ipcRenderer.invoke("servers:refresh", sessionId),
  openAddServerFlow: () => ipcRenderer.invoke("servers:open-add-flow"),

  // Channel sections (local SQLite management)
  loadSections: (sessionId, serverId) => ipcRenderer.invoke("sections:load", sessionId, serverId),
  saveSections: (sessionId, serverId, sections) => ipcRenderer.invoke("sections:save", sessionId, serverId, sections),

  // UI preferences (local SQLite management)
  // App-level preferences (e.g., sidebar width) - not tied to a specific server
  loadAppUIPreference: (sessionId, preferenceKey) => ipcRenderer.invoke("ui-preferences:load-app", sessionId, preferenceKey),
  saveAppUIPreference: (sessionId, preferenceKey, preferenceValue) => ipcRenderer.invoke("ui-preferences:save-app", sessionId, preferenceKey, preferenceValue),
  // Server-level preferences (e.g., channel sorting) - tied to a specific server
  loadServerUIPreference: (sessionId, serverId, preferenceKey) => ipcRenderer.invoke("ui-preferences:load-server", sessionId, serverId, preferenceKey),
  saveServerUIPreference: (sessionId, serverId, preferenceKey, preferenceValue) => ipcRenderer.invoke("ui-preferences:save-server", sessionId, serverId, preferenceKey, preferenceValue),

  // Event listeners
  onSessionAdded: (callback) => ipcRenderer.on("session:added", (event, data) => callback(data)),
  onSessionChanged: (callback) => ipcRenderer.on("session:changed", (event, data) => callback(data)),
  onSessionRemoved: (callback) => ipcRenderer.on("session:removed", (event, data) => callback(data)),
  onServerRemoved: (callback) => ipcRenderer.on("server:removed", (event, data) => callback(data)),

  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

