const { app, BrowserWindow, ipcMain, shell, net } = require("electron");
const path = require("path");
const { initializeDatabase } = require("./database-sessions");
const sessionManager = require("./session-manager");

// Simple fetch wrapper using Electron's net module
async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: options.method || 'GET',
      url: url,
    });

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        request.setHeader(key, value);
      });
    }

    request.on('response', (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          json: async () => JSON.parse(data),
          text: async () => data,
        });
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

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
    const devHost = process.env.HOST || "localhost";
    const devPort = process.env.PORT || "5173";
    mainWindow.loadURL(`http://${devHost}:${devPort}`);
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

// Electron APIs are only available when running in Electron context
if (app) {
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
  console.log("=".repeat(80));
  console.log("📨 PROTOCOL URL RECEIVED:", url);
  console.log("=".repeat(80));

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
    console.log("=".repeat(80));
    console.log("🔄 ADDING SERVER SESSION");
    console.log("Server:", connectionData.server?.name);
    console.log("User:", connectionData.user?.username);
    console.log("API URL:", connectionData.apiUrl);
    console.log("=".repeat(80));

    // Add the session (or update if exists)
    const session = sessionManager.addSession({
      userId: connectionData.user.id,
      username: connectionData.user.username,
      email: connectionData.user.email,
      displayName: connectionData.user.displayName,
      avatarColor: connectionData.user.avatarColor,
      authToken: connectionData.authToken,
      apiUrl: connectionData.apiUrl,
    });

    console.log("✅ Session added/updated:", JSON.stringify(session, null, 2));

    // Check if server is already added by fetching current servers
    let isAlreadyAdded = false;
    try {
      const servers = await sessionManager.fetchServersForSession(session.id);
      isAlreadyAdded = servers.some(s => s.id === connectionData.server.id);
      
      if (isAlreadyAdded) {
        console.log('ℹ️  Server already added to this session, navigating to it...');
      }
    } catch (error) {
      console.warn('⚠️  Could not check if server is already added:', error.message);
    }

    // If not already added, mark it as added via API
    if (!isAlreadyAdded) {
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
    }

    // Invalidate cache to force fresh data
    sessionManager.invalidateServerCache(session.id);

    // Notify renderer to switch to this session (and it will load the server)
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("session:added", { 
        session,
        serverId: connectionData.server.id // Pass server ID so UI can navigate to it
      });
    }
  } catch (error) {
    console.error("❌ Error adding server session:", error);
  }
}

/**
 * Setup IPC Handlers
 */
function setupIpcHandlers() {
  // System: Open external URL
  ipcMain.handle("system:open-external", async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error("Error opening external URL:", error);
      return { success: false, error: error.message };
    }
  });

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

  // Get servers from ALL sessions
  ipcMain.handle("servers:get-all", async (event) => {
    try {
      const servers = await sessionManager.fetchServersFromAllSessions();
      return { success: true, data: servers };
    } catch (error) {
      console.error("Error fetching all servers:", error);
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
      const CONSOLE_URL = process.env.PUBLIC_CONSOLE_URL || "http://localhost:4321";
      shell.openExternal(`${CONSOLE_URL}/servers`);
      return { success: true };
    } catch (error) {
      console.error("Error opening add server flow:", error);
      return { success: false, error: error.message };
    }
  });

  // Channel sections: Load sections for a server
  ipcMain.handle("sections:load", async (event, sessionId, serverId) => {
    try {
      const { getDb } = require("./database-sessions");
      const db = getDb();

      // Load sections
      const sections = db.prepare(`
        SELECT id, name, type, collapsed, is_default, display_order
        FROM channel_sections
        WHERE session_id = ? AND server_id = ?
        ORDER BY display_order ASC
      `).all(sessionId, serverId);

      // Load channel items for each section
      const items = db.prepare(`
        SELECT section_id, channel_id, display_order
        FROM channel_section_items
        WHERE session_id = ? AND server_id = ?
        ORDER BY display_order ASC
      `).all(sessionId, serverId);

      // Group items by section
      const itemsBySection = items.reduce((acc, item) => {
        if (!acc[item.section_id]) {
          acc[item.section_id] = [];
        }
        acc[item.section_id].push(item.channel_id);
        return acc;
      }, {});

      // Combine sections with their items
      const result = sections.map(section => ({
        id: section.id,
        name: section.name,
        type: section.type,
        collapsed: section.collapsed === 1,
        isDefault: section.is_default === 1,
        channelIds: itemsBySection[section.id] || [],
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error("Error loading sections:", error);
      return { success: false, error: error.message };
    }
  });

  // Channel sections: Save sections for a server
  ipcMain.handle("sections:save", async (event, sessionId, serverId, sections) => {
    try {
      const { getDb } = require("./database-sessions");
      const db = getDb();

      // Use a transaction to ensure atomicity
      const transaction = db.transaction(() => {
        // Delete existing sections and items for this server
        db.prepare('DELETE FROM channel_section_items WHERE session_id = ? AND server_id = ?')
          .run(sessionId, serverId);
        db.prepare('DELETE FROM channel_sections WHERE session_id = ? AND server_id = ?')
          .run(sessionId, serverId);

        // Insert new sections
        const insertSection = db.prepare(`
          INSERT INTO channel_sections (id, session_id, server_id, name, type, collapsed, is_default, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertItem = db.prepare(`
          INSERT INTO channel_section_items (section_id, session_id, server_id, channel_id, display_order)
          VALUES (?, ?, ?, ?, ?)
        `);

        sections.forEach((section, sectionIndex) => {
          // Insert section
          insertSection.run(
            section.id,
            sessionId,
            serverId,
            section.name,
            section.type,
            section.collapsed ? 1 : 0,
            section.isDefault ? 1 : 0,
            sectionIndex
          );

          // Insert channel items
          section.channelIds.forEach((channelId, itemIndex) => {
            insertItem.run(
              section.id,
              sessionId,
              serverId,
              channelId,
              itemIndex
            );
          });
        });
      });

      transaction();

      return { success: true };
    } catch (error) {
      console.error("Error saving sections:", error);
      return { success: false, error: error.message };
    }
  });

  // UI Preferences handlers (app-level)
  ipcMain.handle("ui-preferences:load-app", async (event, sessionId, preferenceKey) => {
    try {
      const { getDb } = require("./database-sessions");
      const db = getDb();

      console.log("🔍 [LOAD] Session ID:", sessionId, "Key:", preferenceKey);
      
      const preference = db.prepare(`
        SELECT preference_value
        FROM ui_preferences
        WHERE session_id = ? AND server_id = -1 AND preference_key = ?
      `).get(sessionId, preferenceKey);

      console.log("🔍 [LOAD] Result:", preference);
      
      // Also check what's in the table
      const allPrefs = db.prepare(`
        SELECT * FROM ui_preferences WHERE preference_key = ?
      `).all(preferenceKey);
      console.log("🔍 [LOAD] All preferences with this key:", allPrefs);

      return { 
        success: true, 
        data: preference ? preference.preference_value : null 
      };
    } catch (error) {
      console.error("Error loading app UI preference:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ui-preferences:save-app", async (event, sessionId, preferenceKey, preferenceValue) => {
    try {
      const { getDb } = require("./database-sessions");
      const db = getDb();

      console.log("💾 [SAVE] Session ID:", sessionId, "Key:", preferenceKey, "Value:", preferenceValue);

      // Check the actual schema
      const schemaInfo = db.prepare(`
        SELECT sql FROM sqlite_master WHERE type='table' AND name='ui_preferences'
      `).get();
      console.log("💾 [SAVE] Table schema:", schemaInfo);

      const result = db.prepare(`
        INSERT INTO ui_preferences (session_id, server_id, preference_key, preference_value)
        VALUES (?, -1, ?, ?)
        ON CONFLICT(session_id, server_id, preference_key) 
        DO UPDATE SET preference_value = ?, updated_at = CURRENT_TIMESTAMP
      `).run(sessionId, preferenceKey, preferenceValue, preferenceValue);

      console.log("💾 [SAVE] DB result:", result);
      
      // Verify the save
      const verify = db.prepare(`
        SELECT * FROM ui_preferences 
        WHERE session_id = ? AND server_id = -1 AND preference_key = ?
      `).get(sessionId, preferenceKey);
      console.log("💾 [SAVE] Verification query:", verify);

      return { success: true };
    } catch (error) {
      console.error("Error saving app UI preference:", error);
      return { success: false, error: error.message };
    }
  });

  // UI Preferences handlers (server-level)
  ipcMain.handle("ui-preferences:load-server", async (event, sessionId, serverId, preferenceKey) => {
    try {
      const { getDb } = require("./database-sessions");
      const db = getDb();

      const preference = db.prepare(`
        SELECT preference_value
        FROM ui_preferences
        WHERE session_id = ? AND server_id = ? AND preference_key = ?
      `).get(sessionId, serverId, preferenceKey);

      return { 
        success: true, 
        data: preference ? preference.preference_value : null 
      };
    } catch (error) {
      console.error("Error loading server UI preference:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ui-preferences:save-server", async (event, sessionId, serverId, preferenceKey, preferenceValue) => {
    try {
      const { getDb } = require("./database-sessions");
      const db = getDb();

      db.prepare(`
        INSERT INTO ui_preferences (session_id, server_id, preference_key, preference_value)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(session_id, server_id, preference_key) 
        DO UPDATE SET preference_value = ?, updated_at = CURRENT_TIMESTAMP
      `).run(sessionId, serverId, preferenceKey, preferenceValue, preferenceValue);

      return { success: true };
    } catch (error) {
      console.error("Error saving server UI preference:", error);
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

