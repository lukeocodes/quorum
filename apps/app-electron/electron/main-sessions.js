const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const { initializeDatabase } = require("./database-sessions");
const sessionManager = require("./session-manager");

let mainWindow;
let pendingConnectionData = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "hiddenInset",
    frame: true,
  });

  // Load the app
  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// Register custom protocol handler
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("quorum", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("quorum");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance
    // Focus the main window and handle any protocol URLs
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Handle protocol on second instance
    const url = commandLine.find((arg) => arg.startsWith("quorum://"));
    if (url) {
      handleProtocolUrl(url);
    }
  });

  app.whenReady().then(async () => {
    try {
      // Initialize database
      console.log("Initializing session database...");
      initializeDatabase();

      // Initialize session manager
      console.log("Initializing session manager...");
      await sessionManager.initialize();

      // Create window
      createWindow();

      // Set up IPC handlers
      setupIpcHandlers();

      // Handle any pending connection data
      if (pendingConnectionData) {
        setTimeout(() => {
          handleAddServer(pendingConnectionData);
          pendingConnectionData = null;
        }, 1000);
      }
    } catch (error) {
      console.error("Error during app initialization:", error);
    }
  });
}

// Handle protocol URLs on macOS
app.on("open-url", (event, url) => {
  event.preventDefault();
  console.log("Received protocol URL (open-url):", url);
  handleProtocolUrl(url);
});

// Handle protocol URLs on Windows/Linux via command line
if (process.platform !== "darwin") {
  const protocolUrl = process.argv.find((arg) => arg.startsWith("quorum://"));
  if (protocolUrl) {
    console.log("Received protocol URL (command line):", protocolUrl);
    if (app.isReady()) {
      handleProtocolUrl(protocolUrl);
    } else {
      app.on("ready", () => handleProtocolUrl(protocolUrl));
    }
  }
}

/**
 * Handle custom protocol URLs
 */
function handleProtocolUrl(url) {
  console.log("📨 Processing protocol URL:", url);

  try {
    const urlObj = new URL(url);
    const action = urlObj.hostname;
    const params = new URLSearchParams(urlObj.search);

    if (action === "add-server") {
      const dataParam = params.get("data");
      if (!dataParam) {
        console.error("❌ Missing data parameter in protocol URL");
        return;
      }

      try {
        const jsonData = Buffer.from(dataParam, "base64").toString("utf-8");
        const connectionData = JSON.parse(jsonData);

        console.log("✅ Parsed connection data:", {
          server: connectionData.server?.name,
          user: connectionData.user?.username,
        });

        if (mainWindow && mainWindow.webContents) {
          handleAddServer(connectionData);
        } else {
          console.log("⏳ Window not ready, storing for later");
          pendingConnectionData = connectionData;
        }
      } catch (error) {
        console.error("❌ Error parsing connection data:", error);
      }
    }
  } catch (error) {
    console.error("❌ Error handling protocol URL:", error);
  }
}

/**
 * Handle adding a server (adds session)
 */
async function handleAddServer(connectionData) {
  try {
    console.log("🔄 Adding server session...");

    // Add the session
    const session = sessionManager.addSession({
      userId: connectionData.user.id,
      username: connectionData.user.username,
      email: connectionData.user.email,
      displayName: connectionData.user.displayName,
      avatarColor: connectionData.user.avatarColor,
      authToken: connectionData.authToken,
      apiUrl: connectionData.apiUrl,
    });

    console.log("✅ Session added:", session);

    // Mark the server as added via API
    try {
      const response = await fetch(`${connectionData.apiUrl}/discovery/servers/${connectionData.server.id}/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connectionData.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Server marked as added in API');
      } else {
        console.warn('⚠️  Failed to mark server as added in API:', response.status);
      }
    } catch (error) {
      console.warn('⚠️  Could not sync with API:', error.message);
    }

    // Invalidate cache to force fresh data
    sessionManager.invalidateServerCache(session.id);

    // Notify renderer
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("session:added", { session });
    }
  } catch (error) {
    console.error("❌ Error adding server session:", error);
  }
}

/**
 * Setup IPC Handlers
 */
function setupIpcHandlers() {
  // Get all sessions
  ipcMain.handle("sessions:get-all", async () => {
    try {
      const sessions = sessionManager.getAllSessions();
      return { success: true, data: sessions };
    } catch (error) {
      console.error("Error getting sessions:", error);
      return { success: false, error: error.message };
    }
  });

  // Get active session
  ipcMain.handle("sessions:get-active", async () => {
    try {
      const session = sessionManager.getActiveSession();
      return { success: true, data: session };
    } catch (error) {
      console.error("Error getting active session:", error);
      return { success: false, error: error.message };
    }
  });

  // Set active session
  ipcMain.handle("sessions:set-active", async (event, sessionId) => {
    try {
      const session = sessionManager.setActiveSession(sessionId);

      // Notify renderer
      mainWindow?.webContents.send("session:changed", { session });

      return { success: true, data: session };
    } catch (error) {
      console.error("Error setting active session:", error);
      return { success: false, error: error.message };
    }
  });

  // Remove a session
  ipcMain.handle("sessions:remove", async (event, sessionId) => {
    try {
      sessionManager.removeSession(sessionId);

      // Notify renderer
      mainWindow?.webContents.send("session:removed", { sessionId });

      return { success: true };
    } catch (error) {
      console.error("Error removing session:", error);
      return { success: false, error: error.message };
    }
  });

  // Get servers for active session
  ipcMain.handle("servers:get-for-session", async (event, sessionId) => {
    try {
      const servers = await sessionManager.fetchServersForSession(sessionId);
      return { success: true, data: servers };
    } catch (error) {
      console.error("Error fetching servers:", error);
      return { success: false, error: error.message };
    }
  });

  // Update server display order
  ipcMain.handle("servers:update-order", async (event, sessionId, serverId, newOrder) => {
    try {
      sessionManager.updateServerDisplayOrder(sessionId, serverId, newOrder);
      return { success: true };
    } catch (error) {
      console.error("Error updating server order:", error);
      return { success: false, error: error.message };
    }
  });

  // Remove server (marks as removed in API)
  ipcMain.handle("servers:remove", async (event, serverId) => {
    try {
      const session = sessionManager.getActiveSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Mark as removed in API
      const response = await fetch(`${session.apiUrl}/discovery/servers/${serverId}/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to remove server from API:', response.status);
      }

      // Invalidate cache
      sessionManager.invalidateServerCache(session.id);

      // Notify renderer
      mainWindow?.webContents.send("server:removed", { serverId });

      return { success: true };
    } catch (error) {
      console.error("Error removing server:", error);
      return { success: false, error: error.message };
    }
  });

  // Refresh servers (invalidate cache)
  ipcMain.handle("servers:refresh", async (event, sessionId) => {
    try {
      sessionManager.invalidateServerCache(sessionId);
      const servers = await sessionManager.fetchServersForSession(sessionId);
      return { success: true, data: servers };
    } catch (error) {
      console.error("Error refreshing servers:", error);
      return { success: false, error: error.message };
    }
  });

  // Open add server flow
  ipcMain.handle("servers:open-add-flow", async () => {
    try {
      const WEB_APP_URL = process.env.VITE_WEB_APP_URL || "http://localhost:4321";
      shell.openExternal(`${WEB_APP_URL}/servers`);
      return { success: true };
    } catch (error) {
      console.error("Error opening add server flow:", error);
      return { success: false, error: error.message };
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

