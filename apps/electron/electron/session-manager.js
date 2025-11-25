const { getDb } = require('./database-sessions');
const { net } = require('electron');

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
          statusCode: response.statusCode,
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

class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> session data
    this.activeSessionId = null;
    this.serverCache = new Map(); // sessionId -> {servers: [], fetchedAt: timestamp}
  }

  /**
   * Initialize manager and load all sessions from database
   */
  async initialize() {
    const db = getDb();

    // Load all user sessions
    const sessions = db
      .prepare(
        `SELECT * FROM user_sessions ORDER BY created_at ASC`
      )
      .all();

    for (const session of sessions) {
      this.sessions.set(session.id, {
        id: session.id,
        userId: session.user_id,
        username: session.username,
        email: session.email,
        displayName: session.display_name,
        avatarColor: session.avatar_color,
        authToken: session.auth_token,
        apiUrl: session.api_url,
        isActive: session.is_active === 1,
      });

      if (session.is_active === 1) {
        this.activeSessionId = session.id;
      }
    }

    console.log(`Loaded ${this.sessions.size} user sessions`);
    return this.sessions;
  }

  /**
   * Add a new user session
   */
  addSession({ userId, username, email, displayName, avatarColor, authToken, apiUrl }) {
    const db = getDb();

    try {
      console.log('Adding session for user:', username);

      // Check if session already exists
      const existing = db
        .prepare('SELECT id FROM user_sessions WHERE user_id = ? AND api_url = ?')
        .get(userId, apiUrl);

      if (existing) {
        // Update existing session
        db.prepare(
          `UPDATE user_sessions 
           SET auth_token = ?, display_name = ?, avatar_color = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).run(authToken, displayName, avatarColor, existing.id);

        const session = {
          id: existing.id,
          userId,
          username,
          email,
          displayName,
          avatarColor,
          authToken,
          apiUrl,
          isActive: this.sessions.size === 0,
        };

        this.sessions.set(existing.id, session);

        if (this.sessions.size === 1) {
          this.setActiveSession(existing.id);
        }

        console.log('Updated existing session:', session);
        return session;
      }

      // Insert new session
      const result = db.prepare(
        `INSERT INTO user_sessions (user_id, username, email, display_name, avatar_color, auth_token, api_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        userId,
        username,
        email,
        displayName || username,
        avatarColor || '#8b5cf6',
        authToken,
        apiUrl,
        this.sessions.size === 0 ? 1 : 0
      );

      const sessionId = result.lastInsertRowid;
      const session = {
        id: sessionId,
        userId,
        username,
        email,
        displayName: displayName || username,
        avatarColor: avatarColor || '#8b5cf6',
        authToken,
        apiUrl,
        isActive: this.sessions.size === 0,
      };

      this.sessions.set(sessionId, session);

      // If first session, make it active
      if (this.sessions.size === 1) {
        this.activeSessionId = sessionId;
      }

      console.log('Added new session:', session);
      return session;
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  }

  /**
   * Remove a user session
   */
  removeSession(sessionId) {
    const db = getDb();

    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Delete from database (cascades to server_display_order)
      db.prepare('DELETE FROM user_sessions WHERE id = ?').run(sessionId);

      // Remove from memory
      this.sessions.delete(sessionId);
      this.serverCache.delete(sessionId);

      // If this was the active session, switch to another
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;

        // Switch to the first available session
        if (this.sessions.size > 0) {
          const firstSession = this.sessions.values().next().value;
          this.setActiveSession(firstSession.id);
        }
      }

      console.log(`Removed session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error removing session:', error);
      throw error;
    }
  }

  /**
   * Set the active session
   */
  setActiveSession(sessionId) {
    const db = getDb();

    if (!this.sessions.has(sessionId)) {
      throw new Error('Session not found');
    }

    try {
      // Update database
      db.prepare('UPDATE user_sessions SET is_active = 0').run();
      db.prepare('UPDATE user_sessions SET is_active = 1 WHERE id = ?').run(sessionId);

      // Update memory
      for (const [id, session] of this.sessions) {
        session.isActive = id === sessionId;
      }

      this.activeSessionId = sessionId;
      console.log(`Switched to session ${sessionId}`);

      return this.sessions.get(sessionId);
    } catch (error) {
      console.error('Error setting active session:', error);
      throw error;
    }
  }

  /**
   * Get the active session
   */
  getActiveSession() {
    if (!this.activeSessionId) {
      return null;
    }
    return this.sessions.get(this.activeSessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Fetch servers for a session from the API
   */
  async fetchServersForSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      // Check cache (5 minute cache)
      const cached = this.serverCache.get(sessionId);
      if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) {
        console.log('Returning cached servers for session', sessionId);
        return cached.servers;
      }

      const url = `${session.apiUrl}/discovery/servers/added`;
      console.log('🌐 Fetching servers from:', url);
      console.log('🔑 Using token:', session.authToken.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('❌ Session expired for', session.username);
        }
        const errorText = await response.text();
        console.error('❌ API error:', errorText);
        throw new Error(`Failed to fetch servers: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API response data:', data);
      const servers = data.data || [];
      console.log(`✅ Received ${servers.length} servers:`, servers.map(s => s.name));

      // Apply local display order
      const orderedServers = this._applyDisplayOrder(sessionId, servers);

      // Update cache
      this.serverCache.set(sessionId, {
        servers: orderedServers,
        fetchedAt: Date.now(),
      });

      console.log('💾 Cached servers for session', sessionId);
      return orderedServers;
    } catch (error) {
      console.error('❌ Error fetching servers:', error);
      throw error;
    }
  }

  /**
   * Apply local display order to servers
   */
  _applyDisplayOrder(sessionId, servers) {
    const db = getDb();

    // Get display order preferences
    const orders = db
      .prepare('SELECT server_id, display_order FROM server_display_order WHERE session_id = ?')
      .all(sessionId);

    const orderMap = new Map(orders.map((o) => [o.server_id, o.display_order]));

    // Sort servers by display order, or append at end if no order set
    return servers.sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? 999999;
      const orderB = orderMap.get(b.id) ?? 999999;
      return orderA - orderB;
    });
  }

  /**
   * Update server display order
   */
  updateServerDisplayOrder(sessionId, serverId, newOrder) {
    const db = getDb();

    try {
      db.prepare(
        `INSERT INTO server_display_order (session_id, server_id, display_order)
         VALUES (?, ?, ?)
         ON CONFLICT(session_id, server_id)
         DO UPDATE SET display_order = ?, updated_at = CURRENT_TIMESTAMP`
      ).run(sessionId, serverId, newOrder, newOrder);

      // Invalidate cache
      this.serverCache.delete(sessionId);

      return true;
    } catch (error) {
      console.error('Error updating server display order:', error);
      throw error;
    }
  }

  /**
   * Invalidate server cache (force refetch)
   */
  invalidateServerCache(sessionId = null) {
    if (sessionId) {
      this.serverCache.delete(sessionId);
    } else {
      this.serverCache.clear();
    }
  }

  /**
   * Fetch servers from ALL sessions and merge them
   */
  async fetchServersFromAllSessions() {
    const allSessions = this.getAllSessions();
    const allServers = [];

    console.log(`🔄 Fetching servers from ${allSessions.length} sessions`);

    for (const session of allSessions) {
      try {
        const servers = await this.fetchServersForSession(session.id);
        
        // Tag each server with session info so we know which auth token to use
        const serversWithSession = servers.map(server => ({
          ...server,
          sessionId: session.id,
          sessionUserId: session.userId,
          sessionUsername: session.username,
          sessionAuthToken: session.authToken,
          sessionApiUrl: session.apiUrl,
        }));

        allServers.push(...serversWithSession);
        console.log(`✅ Added ${servers.length} servers from ${session.username}`);
      } catch (error) {
        console.error(`❌ Failed to fetch servers for session ${session.id} (${session.username}):`, error.message);
        // Continue with other sessions even if one fails
      }
    }

    console.log(`✅ Total servers from all sessions: ${allServers.length}`);
    return allServers;
  }
}

// Singleton instance
const sessionManager = new SessionManager();

module.exports = sessionManager;

