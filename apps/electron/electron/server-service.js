const crypto = require("crypto");
const { getPool } = require("./database");

/**
 * Generate a unique invite code
 */
function generateInviteCode() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Create a new server
 */
async function createServer(
  userId,
  name,
  description = null,
  isPublic = false
) {
  const pool = getPool();

  try {
    // Generate unique invite code
    const inviteCode = generateInviteCode();

    // Create server
    const result = await pool.query(
      `INSERT INTO servers (name, description, owner_id, is_public, invite_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, owner_id, is_public, invite_code, created_at`,
      [name, description, userId, isPublic, inviteCode]
    );

    const server = result.rows[0];

    // Add creator as owner member
    await pool.query(
      `INSERT INTO server_members (server_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [server.id, userId]
    );

    // Create a default "General" room
    await pool.query(
      `INSERT INTO rooms (server_id, name, description)
       VALUES ($1, 'General', 'General discussion')`,
      [server.id]
    );

    return server;
  } catch (error) {
    console.error("Create server error:", error);
    throw error;
  }
}

/**
 * Get all servers for a user
 */
async function getUserServers(userId) {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT s.*, sm.role, u.username as owner_username
       FROM servers s
       JOIN server_members sm ON s.id = sm.server_id
       JOIN users u ON s.owner_id = u.id
       WHERE sm.user_id = $1 AND s.archived = FALSE
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error("Get user servers error:", error);
    throw error;
  }
}

/**
 * Get a specific server by ID (with permission check)
 */
async function getServer(serverId, userId) {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT s.*, sm.role, u.username as owner_username
       FROM servers s
       JOIN server_members sm ON s.id = sm.server_id
       JOIN users u ON s.owner_id = u.id
       WHERE s.id = $1 AND sm.user_id = $2`,
      [serverId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Server not found or access denied");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Get server error:", error);
    throw error;
  }
}

/**
 * Update server settings (owner/admin only)
 */
async function updateServer(serverId, userId, updates) {
  const pool = getPool();

  try {
    // Check if user is owner or admin
    const memberResult = await pool.query(
      "SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2",
      [serverId, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new Error("Access denied");
    }

    const role = memberResult.rows[0].role;
    if (role !== "owner" && role !== "admin") {
      throw new Error("Only owners and admins can update server settings");
    }

    const { name, description, isPublic } = updates;

    const result = await pool.query(
      `UPDATE servers
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_public = COALESCE($3, is_public)
       WHERE id = $4
       RETURNING *`,
      [name, description, isPublic, serverId]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Update server error:", error);
    throw error;
  }
}

/**
 * Delete/archive a server (owner only)
 */
async function deleteServer(serverId, userId) {
  const pool = getPool();

  try {
    // Check if user is owner
    const serverResult = await pool.query(
      "SELECT owner_id FROM servers WHERE id = $1",
      [serverId]
    );

    if (serverResult.rows.length === 0) {
      throw new Error("Server not found");
    }

    if (serverResult.rows[0].owner_id !== userId) {
      throw new Error("Only the server owner can delete the server");
    }

    // Archive instead of delete to preserve data
    await pool.query("UPDATE servers SET archived = TRUE WHERE id = $1", [
      serverId,
    ]);

    return true;
  } catch (error) {
    console.error("Delete server error:", error);
    throw error;
  }
}

/**
 * Get server members
 */
async function getServerMembers(serverId, userId) {
  const pool = getPool();

  try {
    // Check if user is a member
    const memberCheck = await pool.query(
      "SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2",
      [serverId, userId]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error("Access denied");
    }

    // Get all members
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_color, sm.role, sm.joined_at
       FROM server_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.server_id = $1
       ORDER BY sm.joined_at ASC`,
      [serverId]
    );

    return result.rows;
  } catch (error) {
    console.error("Get server members error:", error);
    throw error;
  }
}

/**
 * Create a server invite
 */
async function createInvite(
  serverId,
  userId,
  maxUses = null,
  expiresIn = null
) {
  const pool = getPool();

  try {
    // Check if user is owner or admin
    const memberResult = await pool.query(
      "SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2",
      [serverId, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new Error("Access denied");
    }

    const role = memberResult.rows[0].role;
    if (role !== "owner" && role !== "admin") {
      throw new Error("Only owners and admins can create invites");
    }

    const code = generateInviteCode();
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;

    const result = await pool.query(
      `INSERT INTO server_invites (server_id, created_by, code, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [serverId, userId, code, maxUses, expiresAt]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Create invite error:", error);
    throw error;
  }
}

/**
 * Join a server using invite code
 */
async function joinServerWithInvite(code, userId) {
  const pool = getPool();

  try {
    // Get invite details
    const inviteResult = await pool.query(
      `SELECT si.*, s.is_public, s.name as server_name
       FROM server_invites si
       JOIN servers s ON si.server_id = s.id
       WHERE si.code = $1 AND s.archived = FALSE`,
      [code]
    );

    if (inviteResult.rows.length === 0) {
      throw new Error("Invalid invite code");
    }

    const invite = inviteResult.rows[0];

    // Check if invite is expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite has expired");
    }

    // Check if invite has reached max uses
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      throw new Error("Invite has reached maximum uses");
    }

    // Check if user is already a member
    const memberCheck = await pool.query(
      "SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2",
      [invite.server_id, userId]
    );

    if (memberCheck.rows.length > 0) {
      throw new Error("You are already a member of this server");
    }

    // Add user to server
    await pool.query(
      `INSERT INTO server_members (server_id, user_id, role)
       VALUES ($1, $2, 'member')`,
      [invite.server_id, userId]
    );

    // Increment invite uses
    await pool.query(
      "UPDATE server_invites SET uses = uses + 1 WHERE id = $1",
      [invite.id]
    );

    // Return server details
    return await getServer(invite.server_id, userId);
  } catch (error) {
    console.error("Join server error:", error);
    throw error;
  }
}

/**
 * Join a public server
 */
async function joinPublicServer(serverId, userId) {
  const pool = getPool();

  try {
    // Check if server is public
    const serverResult = await pool.query(
      "SELECT is_public, archived FROM servers WHERE id = $1",
      [serverId]
    );

    if (serverResult.rows.length === 0) {
      throw new Error("Server not found");
    }

    if (serverResult.rows[0].archived) {
      throw new Error("Server is archived");
    }

    if (!serverResult.rows[0].is_public) {
      throw new Error("Server is not public");
    }

    // Check if user is already a member
    const memberCheck = await pool.query(
      "SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2",
      [serverId, userId]
    );

    if (memberCheck.rows.length > 0) {
      throw new Error("You are already a member of this server");
    }

    // Add user to server
    await pool.query(
      `INSERT INTO server_members (server_id, user_id, role)
       VALUES ($1, $2, 'member')`,
      [serverId, userId]
    );

    return await getServer(serverId, userId);
  } catch (error) {
    console.error("Join public server error:", error);
    throw error;
  }
}

/**
 * Leave a server
 */
async function leaveServer(serverId, userId) {
  const pool = getPool();

  try {
    // Check if user is the owner
    const serverResult = await pool.query(
      "SELECT owner_id FROM servers WHERE id = $1",
      [serverId]
    );

    if (serverResult.rows.length === 0) {
      throw new Error("Server not found");
    }

    if (serverResult.rows[0].owner_id === userId) {
      throw new Error(
        "Server owner cannot leave. Transfer ownership or delete the server."
      );
    }

    // Remove user from server
    await pool.query(
      "DELETE FROM server_members WHERE server_id = $1 AND user_id = $2",
      [serverId, userId]
    );

    return true;
  } catch (error) {
    console.error("Leave server error:", error);
    throw error;
  }
}

/**
 * Share a channel to another server (owner only)
 */
async function shareChannel(roomId, targetServerId, userId) {
  const pool = getPool();

  try {
    // Get room's source server
    const roomResult = await pool.query(
      "SELECT server_id FROM rooms WHERE id = $1",
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      throw new Error("Room not found");
    }

    const sourceServerId = roomResult.rows[0].server_id;

    // Check if user is owner of source server
    const sourceServerCheck = await pool.query(
      "SELECT owner_id FROM servers WHERE id = $1",
      [sourceServerId]
    );

    if (sourceServerCheck.rows[0].owner_id !== userId) {
      throw new Error("Only the server owner can share channels");
    }

    // Check if target server exists
    const targetServerCheck = await pool.query(
      "SELECT id FROM servers WHERE id = $1 AND archived = FALSE",
      [targetServerId]
    );

    if (targetServerCheck.rows.length === 0) {
      throw new Error("Target server not found");
    }

    // Create channel share
    const result = await pool.query(
      `INSERT INTO channel_shares (room_id, source_server_id, target_server_id, shared_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_id, target_server_id) DO NOTHING
       RETURNING *`,
      [roomId, sourceServerId, targetServerId, userId]
    );

    return (
      result.rows[0] || { message: "Channel already shared with this server" }
    );
  } catch (error) {
    console.error("Share channel error:", error);
    throw error;
  }
}

/**
 * Get public servers
 */
async function getPublicServers(limit = 50, offset = 0) {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.description, s.created_at, u.username as owner_username,
              COUNT(sm.id) as member_count
       FROM servers s
       JOIN users u ON s.owner_id = u.id
       LEFT JOIN server_members sm ON s.id = sm.server_id
       WHERE s.is_public = TRUE AND s.archived = FALSE
       GROUP BY s.id, u.username
       ORDER BY member_count DESC, s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error("Get public servers error:", error);
    throw error;
  }
}

module.exports = {
  createServer,
  getUserServers,
  getServer,
  updateServer,
  deleteServer,
  getServerMembers,
  createInvite,
  joinServerWithInvite,
  joinPublicServer,
  leaveServer,
  shareChannel,
  getPublicServers,
};
