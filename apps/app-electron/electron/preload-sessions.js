const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use ipcRenderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Sessions (replaces connections)
  getAllSessions: () => ipcRenderer.invoke("sessions:get-all"),
  getActiveSession: () => ipcRenderer.invoke("sessions:get-active"),
  setActiveSession: (sessionId) => ipcRenderer.invoke("sessions:set-active", sessionId),
  removeSession: (sessionId) => ipcRenderer.invoke("sessions:remove", sessionId),

  // Servers (fetched from API)
  getServersForSession: (sessionId) => ipcRenderer.invoke("servers:get-for-session", sessionId),
  updateServerOrder: (sessionId, serverId, newOrder) => ipcRenderer.invoke("servers:update-order", sessionId, serverId, newOrder),
  removeServer: (serverId) => ipcRenderer.invoke("servers:remove", serverId),
  refreshServers: (sessionId) => ipcRenderer.invoke("servers:refresh", sessionId),
  openAddServerFlow: () => ipcRenderer.invoke("servers:open-add-flow"),

  // Event listeners
  onSessionAdded: (callback) => ipcRenderer.on("session:added", (event, data) => callback(data)),
  onSessionChanged: (callback) => ipcRenderer.on("session:changed", (event, data) => callback(data)),
  onSessionRemoved: (callback) => ipcRenderer.on("session:removed", (event, data) => callback(data)),
  onServerRemoved: (callback) => ipcRenderer.on("server:removed", (event, data) => callback(data)),

  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

