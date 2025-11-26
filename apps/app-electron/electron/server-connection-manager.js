const { getDb } = require('./database-new');

class ServerConnectionManager {
  constructor() {
    this.connections = new Map(); // connectionId -> { id, apiUrl, token, client }
    this.activeConnectionId = null;
  }

  /**
   * Initialize manager and load all connections from database
   */
  async initialize() {
    const db = getDb();

    // Load all server connections
    const connections = db
      .prepare(
        `SELECT sc.*, sa.auth_token, sa.user_id, sa.username, sa.email, sa.display_name, sa.avatar_color
         FROM server_connections sc
         LEFT JOIN server_auth sa ON sc.id = sa.connection_id
         ORDER BY sc.display_order ASC`
      )
      .all();

    for (const conn of connections) {
      this.connections.set(conn.id, {
        id: conn.id,
        name: conn.name,
        apiUrl: conn.api_url,
        serverId: conn.server_id,
        iconUrl: conn.icon_url,
        iconColor: conn.icon_color,
        displayOrder: conn.display_order,
        isActive: conn.is_active === 1,
        authToken: conn.auth_token,
        userId: conn.user_id,
        username: conn.username,
        email: conn.email,
        displayName: conn.display_name,
        avatarColor: conn.avatar_color,
      });

      if (conn.is_active === 1) {
        this.activeConnectionId = conn.id;
      }
    }

    console.log(`Loaded ${this.connections.size} server connections`);
    return this.connections;
  }

  /**
   * Add a new server connection
   */
  async addConnection({ name, apiUrl, serverId, authToken, userInfo, iconUrl, iconColor }) {
    const db = getDb();

    try {
      console.log('Adding connection with data:', { name, apiUrl, serverId, userInfo });
      
      // Get the next display order
      const maxOrder = db
        .prepare('SELECT MAX(display_order) as max FROM server_connections')
        .get();
      const displayOrder = (maxOrder.max || 0) + 1;

      console.log('Display order will be:', displayOrder);

      // Insert server connection
      const insertConnection = db.prepare(
        `INSERT INTO server_connections (name, api_url, server_id, icon_url, icon_color, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      const result = insertConnection.run(
        name,
        apiUrl,
        serverId,
        iconUrl || null,
        iconColor || '#8b5cf6',
        displayOrder,
        this.connections.size === 0 ? 1 : 0 // First connection is active
      );

      const connectionId = result.lastInsertRowid;
      console.log('Server connection inserted with ID:', connectionId);

      // Insert auth info
      const insertAuth = db.prepare(
        `INSERT INTO server_auth (connection_id, auth_token, user_id, username, email, display_name, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      console.log('Inserting auth info for user:', userInfo.username);
      insertAuth.run(
        connectionId,
        authToken,
        userInfo.id,
        userInfo.username,
        userInfo.email,
        userInfo.displayName || userInfo.username,
        userInfo.avatarColor || '#8b5cf6'
      );
      console.log('Auth info inserted successfully');

      // Notify the API that this server has been added to desktop
      try {
        const response = await fetch(`${apiUrl}/discovery/servers/${serverId}/add`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('Successfully marked server as added in central database');
        } else {
          console.warn('Failed to mark server as added in central database:', response.status);
        }
      } catch (error) {
        console.warn('Could not sync server addition to API (non-fatal):', error.message);
        // Continue - local storage is the source of truth for electron
      }

      // Add to memory
      const connection = {
        id: connectionId,
        name,
        apiUrl,
        serverId,
        iconUrl,
        iconColor: iconColor || '#8b5cf6',
        displayOrder,
        isActive: this.connections.size === 0,
        authToken,
        userId: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        displayName: userInfo.displayName || userInfo.username,
        avatarColor: userInfo.avatarColor || '#8b5cf6',
      };

      this.connections.set(connectionId, connection);
      console.log('Connection added to memory. Total connections:', this.connections.size);

      // If this is the first connection, make it active
      if (this.connections.size === 1) {
        this.activeConnectionId = connectionId;
        console.log('Set as active connection (first one)');
      }

      console.log('Successfully added connection:', connection);
      return connection;
    } catch (error) {
      console.error('Error adding connection:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Remove a server connection
   */
  async removeConnection(connectionId) {
    const db = getDb();

    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      // Notify the API that this server has been removed from desktop
      try {
        const response = await fetch(`${connection.apiUrl}/discovery/servers/${connection.serverId}/remove`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('Successfully marked server as removed in central database');
        } else {
          console.warn('Failed to mark server as removed in central database:', response.status);
        }
      } catch (error) {
        console.warn('Could not sync server removal to API (non-fatal):', error.message);
        // Continue - local deletion is what matters for electron
      }

      // Delete from database (cascades to server_auth)
      db.prepare('DELETE FROM server_connections WHERE id = ?').run(connectionId);

      // Remove from memory
      this.connections.delete(connectionId);

      // If this was the active connection, switch to another
      if (this.activeConnectionId === connectionId) {
        this.activeConnectionId = null;

        // Switch to the first available connection
        if (this.connections.size > 0) {
          const firstConnection = this.connections.values().next().value;
          this.setActiveConnection(firstConnection.id);
        }
      }

      console.log(`Removed connection ${connectionId}`);
      return true;
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  /**
   * Set the active connection
   */
  setActiveConnection(connectionId) {
    const db = getDb();

    if (!this.connections.has(connectionId)) {
      throw new Error('Connection not found');
    }

    try {
      // Update database
      db.prepare('UPDATE server_connections SET is_active = 0').run();
      db.prepare('UPDATE server_connections SET is_active = 1 WHERE id = ?').run(
        connectionId
      );

      // Update memory
      for (const [id, conn] of this.connections) {
        conn.isActive = id === connectionId;
      }

      this.activeConnectionId = connectionId;
      console.log(`Switched to connection ${connectionId}`);

      return this.connections.get(connectionId);
    } catch (error) {
      console.error('Error setting active connection:', error);
      throw error;
    }
  }

  /**
   * Get the active connection
   */
  getActiveConnection() {
    if (!this.activeConnectionId) {
      return null;
    }
    return this.connections.get(this.activeConnectionId);
  }

  /**
   * Get all connections
   */
  getAllConnections() {
    return Array.from(this.connections.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
  }

  /**
   * Get a specific connection
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }

  /**
   * Update connection display order
   */
  updateConnectionOrder(connectionId, newOrder) {
    const db = getDb();

    try {
      db.prepare('UPDATE server_connections SET display_order = ? WHERE id = ?').run(
        newOrder,
        connectionId
      );

      const connection = this.connections.get(connectionId);
      if (connection) {
        connection.displayOrder = newOrder;
      }

      return true;
    } catch (error) {
      console.error('Error updating connection order:', error);
      throw error;
    }
  }

  /**
   * Update connection info
   */
  updateConnection(connectionId, updates) {
    const db = getDb();
    const connection = this.connections.get(connectionId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    try {
      const fields = [];
      const values = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
        connection.name = updates.name;
      }

      if (updates.iconUrl !== undefined) {
        fields.push('icon_url = ?');
        values.push(updates.iconUrl);
        connection.iconUrl = updates.iconUrl;
      }

      if (updates.iconColor !== undefined) {
        fields.push('icon_color = ?');
        values.push(updates.iconColor);
        connection.iconColor = updates.iconColor;
      }

      if (fields.length > 0) {
        values.push(connectionId);
        const sql = `UPDATE server_connections SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.prepare(sql).run(...values);
      }

      return connection;
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  }

  /**
   * Check if a connection already exists for this API URL and server
   */
  hasConnection(apiUrl, serverId) {
    for (const conn of this.connections.values()) {
      if (conn.apiUrl === apiUrl && conn.serverId === serverId) {
        return true;
      }
    }
    return false;
  }
}

// Singleton instance
const connectionManager = new ServerConnectionManager();

module.exports = connectionManager;

