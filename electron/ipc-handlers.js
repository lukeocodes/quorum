const { getPool } = require("./database");
const {
  generateOpenAIResponse,
  generateAnthropicResponse,
  updateRoomSummary,
} = require("./ai-service");
const { transcribeWithDeepgram } = require("./voice-service");
const {
  synthesizeWithDeepgram,
  synthesizeWithElevenlabs,
} = require("./speech-service");
const { queueManager } = require("./queue-manager");
const { signUp, login, validateSession, logout } = require("./auth-service");
const {
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
} = require("./server-service");
const { encrypt } = require("./encryption-service");
const { convertMentionsToTags, extractMentionIds } = require("./mention-utils");

// Store current user session in memory (for this Electron instance)
let currentSession = null;

function setupIpcHandlers(ipcMain) {
  const pool = getPool();

  // ========== Authentication ==========
  ipcMain.handle(
    "auth:signup",
    async (event, username, email, password, displayName) => {
      try {
        const result = await signUp(username, email, password, displayName);
        currentSession = result;
        return result;
      } catch (error) {
        console.error("Error during signup:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("auth:login", async (event, usernameOrEmail, password) => {
    try {
      const result = await login(usernameOrEmail, password);
      currentSession = result;
      return result;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  });

  ipcMain.handle("auth:validate", async (event, token) => {
    try {
      const user = await validateSession(token);
      if (user) {
        currentSession = { user, token };
      }
      return user;
    } catch (error) {
      console.error("Error validating session:", error);
      throw error;
    }
  });

  ipcMain.handle("auth:logout", async (event, token) => {
    try {
      await logout(token);
      currentSession = null;
      return { success: true };
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  });

  ipcMain.handle("auth:current-user", async () => {
    return currentSession;
  });

  // ========== Servers ==========
  ipcMain.handle(
    "servers:create",
    async (event, name, description, isPublic) => {
      try {
        if (!currentSession) throw new Error("Not authenticated");
        return await createServer(
          currentSession.user.id,
          name,
          description,
          isPublic
        );
      } catch (error) {
        console.error("Error creating server:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("servers:get-user-servers", async () => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await getUserServers(currentSession.user.id);
    } catch (error) {
      console.error("Error getting user servers:", error);
      throw error;
    }
  });

  ipcMain.handle("servers:get", async (event, serverId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await getServer(serverId, currentSession.user.id);
    } catch (error) {
      console.error("Error getting server:", error);
      throw error;
    }
  });

  ipcMain.handle("servers:update", async (event, serverId, updates) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await updateServer(serverId, currentSession.user.id, updates);
    } catch (error) {
      console.error("Error updating server:", error);
      throw error;
    }
  });

  ipcMain.handle("servers:delete", async (event, serverId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await deleteServer(serverId, currentSession.user.id);
    } catch (error) {
      console.error("Error deleting server:", error);
      throw error;
    }
  });

  ipcMain.handle("servers:get-members", async (event, serverId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await getServerMembers(serverId, currentSession.user.id);
    } catch (error) {
      console.error("Error getting server members:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "servers:create-invite",
    async (event, serverId, maxUses, expiresIn) => {
      try {
        if (!currentSession) throw new Error("Not authenticated");
        return await createInvite(
          serverId,
          currentSession.user.id,
          maxUses,
          expiresIn
        );
      } catch (error) {
        console.error("Error creating invite:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("servers:join-with-invite", async (event, inviteCode) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await joinServerWithInvite(inviteCode, currentSession.user.id);
    } catch (error) {
      console.error("Error joining server with invite:", error);
      throw error;
    }
  });

  ipcMain.handle("servers:join-public", async (event, serverId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await joinPublicServer(serverId, currentSession.user.id);
    } catch (error) {
      console.error("Error joining public server:", error);
      throw error;
    }
  });

  ipcMain.handle("servers:leave", async (event, serverId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");
      return await leaveServer(serverId, currentSession.user.id);
    } catch (error) {
      console.error("Error leaving server:", error);
      throw error;
    }
  });

  ipcMain.handle("servers:get-public", async (event, limit, offset) => {
    try {
      return await getPublicServers(limit, offset);
    } catch (error) {
      console.error("Error getting public servers:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "servers:share-channel",
    async (event, roomId, targetServerId) => {
      try {
        if (!currentSession) throw new Error("Not authenticated");
        return await shareChannel(
          roomId,
          targetServerId,
          currentSession.user.id
        );
      } catch (error) {
        console.error("Error sharing channel:", error);
        throw error;
      }
    }
  );

  // ========== Rooms ==========
  ipcMain.handle("rooms:get", async (event, serverId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");

      // Get rooms for this server, including shared channels
      const result = await pool.query(
        `SELECT r.*, 
                CASE WHEN cs.id IS NOT NULL THEN true ELSE false END as is_shared
         FROM rooms r
         LEFT JOIN channel_shares cs ON r.id = cs.room_id AND cs.target_server_id = $1
         WHERE (r.server_id = $1 OR cs.target_server_id = $1)
           AND r.archived = false
         ORDER BY r.created_at DESC`,
        [serverId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting rooms:", error);
      throw error;
    }
  });

  ipcMain.handle("rooms:create", async (event, serverId, name, description) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");

      // Verify user is a member of the server
      const memberCheck = await pool.query(
        "SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2",
        [serverId, currentSession.user.id]
      );

      if (memberCheck.rows.length === 0) {
        throw new Error("Access denied: Not a member of this server");
      }

      const result = await pool.query(
        "INSERT INTO rooms (server_id, name, description) VALUES ($1, $2, $3) RETURNING *",
        [serverId, name, description]
      );

      // Initialize summary for the room
      await pool.query(
        "INSERT INTO room_summaries (room_id, summary, message_count) VALUES ($1, $2, $3)",
        [result.rows[0].id, "New conversation started.", 0]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  });

  ipcMain.handle("rooms:archive", async (event, roomId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");

      // Check if user has permission (must be server owner/admin)
      const permCheck = await pool.query(
        `SELECT sm.role FROM rooms r
         JOIN server_members sm ON r.server_id = sm.server_id
         WHERE r.id = $1 AND sm.user_id = $2`,
        [roomId, currentSession.user.id]
      );

      if (permCheck.rows.length === 0) {
        throw new Error("Access denied");
      }

      const role = permCheck.rows[0].role;
      if (role !== "owner" && role !== "admin") {
        throw new Error("Only owners and admins can archive rooms");
      }

      await pool.query("UPDATE rooms SET archived = true WHERE id = $1", [
        roomId,
      ]);
      return { success: true };
    } catch (error) {
      console.error("Error archiving room:", error);
      throw error;
    }
  });

  // ========== AI Members ==========
  ipcMain.handle("ai-members:get", async (event, roomId) => {
    try {
      // Don't return the encrypted API key to the frontend
      const result = await pool.query(
        "SELECT id, room_id, name, provider, model, persona, system_instructions, avatar_color, created_at, updated_at FROM ai_members WHERE room_id = $1 ORDER BY created_at ASC",
        [roomId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting AI members:", error);
      throw error;
    }
  });

  // Get mentionable members (users + AIs) for a room
  ipcMain.handle("rooms:get-mentionable-members", async (event, roomId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");

      // Get server members
      const serverResult = await pool.query(
        `SELECT s.id FROM rooms r JOIN servers s ON r.server_id = s.id WHERE r.id = $1`,
        [roomId]
      );

      if (serverResult.rows.length === 0) {
        return { users: [], aiMembers: [] };
      }

      const serverId = serverResult.rows[0].id;

      // Get users in this server
      const usersResult = await pool.query(
        `SELECT u.id, u.username, u.display_name, u.avatar_color
         FROM users u
         JOIN server_members sm ON u.id = sm.user_id
         WHERE sm.server_id = $1
         ORDER BY u.display_name ASC`,
        [serverId]
      );

      // Get AI members in this room
      const aiMembersResult = await pool.query(
        "SELECT id, name, avatar_color FROM ai_members WHERE room_id = $1 ORDER BY name ASC",
        [roomId]
      );

      return {
        users: usersResult.rows,
        aiMembers: aiMembersResult.rows,
      };
    } catch (error) {
      console.error("Error getting mentionable members:", error);
      throw error;
    }
  });

  ipcMain.handle("ai-members:create", async (event, data) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");

      const {
        roomId,
        name,
        provider,
        model,
        apiKey,
        persona,
        systemInstructions,
        avatarColor,
      } = data;

      // Validate API key is provided
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error("API key is required");
      }

      // Encrypt the API key before storing
      const encryptedApiKey = encrypt(apiKey);

      const result = await pool.query(
        `INSERT INTO ai_members (room_id, name, provider, model, api_key_encrypted, persona, system_instructions, avatar_color) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, room_id, name, provider, model, persona, system_instructions, avatar_color, created_at, updated_at`,
        [
          roomId,
          name,
          provider,
          model,
          encryptedApiKey,
          persona,
          systemInstructions,
          avatarColor,
        ]
      );

      // Don't return the encrypted API key to the frontend
      return result.rows[0];
    } catch (error) {
      console.error("Error creating AI member:", error);
      throw error;
    }
  });

  ipcMain.handle("ai-members:delete", async (event, memberId) => {
    try {
      if (!currentSession) throw new Error("Not authenticated");

      await pool.query("DELETE FROM ai_members WHERE id = $1", [memberId]);
      return { success: true };
    } catch (error) {
      console.error("Error deleting AI member:", error);
      throw error;
    }
  });

  // ========== Messages ==========
  ipcMain.handle("messages:get", async (event, roomId, limit = 100) => {
    try {
      const result = await pool.query(
        `SELECT m.*,
                CASE 
                  WHEN m.member_type = 'user' THEN u.username
                  WHEN m.member_type = 'ai' THEN a.name
                END as member_name,
                CASE 
                  WHEN m.member_type = 'user' THEN u.display_name
                  ELSE NULL
                END as member_display_name,
                CASE 
                  WHEN m.member_type = 'user' THEN u.avatar_color
                  WHEN m.member_type = 'ai' THEN a.avatar_color
                END as member_avatar_color,
                reply_msg.content as reply_to_content,
                reply_msg.member_type as reply_to_member_type,
                CASE 
                  WHEN reply_msg.member_type = 'user' THEN reply_user.display_name
                  WHEN reply_msg.member_type = 'ai' THEN reply_ai.name
                END as reply_to_member_name
         FROM messages m
         LEFT JOIN users u ON m.member_type = 'user' AND m.member_id = u.id
         LEFT JOIN ai_members a ON m.member_type = 'ai' AND m.member_id = a.id
         LEFT JOIN messages reply_msg ON m.reply_to_message_id = reply_msg.id
         LEFT JOIN users reply_user ON reply_msg.member_type = 'user' AND reply_msg.member_id = reply_user.id
         LEFT JOIN ai_members reply_ai ON reply_msg.member_type = 'ai' AND reply_msg.member_id = reply_ai.id
         WHERE m.room_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2`,
        [roomId, limit]
      );
      return result.rows.reverse();
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "messages:send",
    async (event, roomId, content, replyToMessageId = null) => {
      try {
        if (!currentSession) throw new Error("Not authenticated");

        // Get all server members (users) and AI members for mention conversion
        const serverResult = await pool.query(
          `SELECT s.id FROM rooms r JOIN servers s ON r.server_id = s.id WHERE r.id = $1`,
          [roomId]
        );

        if (serverResult.rows.length === 0) {
          throw new Error("Room not found");
        }

        const serverId = serverResult.rows[0].id;

        // Get users in this server
        const usersResult = await pool.query(
          `SELECT u.id, u.username, u.display_name 
         FROM users u
         JOIN server_members sm ON u.id = sm.user_id
         WHERE sm.server_id = $1`,
          [serverId]
        );

        // Get AI members in this room
        const aiMembersResult = await pool.query(
          "SELECT id, name FROM ai_members WHERE room_id = $1",
          [roomId]
        );

        // Convert @mentions to tags like <@user:123> or <@ai:456>
        const {
          content: taggedContent,
          mentionedUsers,
          mentionedAIs,
        } = convertMentionsToTags(
          content,
          usersResult.rows,
          aiMembersResult.rows
        );

        // Save user message with tagged content
        const result = await pool.query(
          "INSERT INTO messages (room_id, member_type, member_id, content, reply_to_message_id) VALUES ($1, 'user', $2, $3, $4) RETURNING *",
          [roomId, currentSession.user.id, taggedContent, replyToMessageId]
        );

        const message = result.rows[0];

        // Store mentions in database using polymorphic references
        for (const user of mentionedUsers) {
          await pool.query(
            "INSERT INTO message_mentions (message_id, mentioned_member_type, mentioned_member_id) VALUES ($1, 'user', $2)",
            [message.id, user.id]
          );
        }

        for (const ai of mentionedAIs) {
          await pool.query(
            "INSERT INTO message_mentions (message_id, mentioned_member_type, mentioned_member_id) VALUES ($1, 'ai', $2)",
            [message.id, ai.id]
          );
        }

        // Only trigger AI responses if AIs were mentioned
        if (mentionedAIs.length > 0) {
          // Get full AI member data for queue
          const fullAIsResult = await pool.query(
            "SELECT * FROM ai_members WHERE id = ANY($1)",
            [mentionedAIs.map((ai) => ai.id)]
          );

          // Queue AI responses for mentioned AIs only (they reply to this message)
          queueAIResponses(
            pool,
            roomId,
            fullAIsResult.rows,
            event.sender,
            message.id
          );
        }

        // Update summary in background
        updateRoomSummary(pool, roomId).catch((err) =>
          console.error("Error updating summary:", err)
        );

        return message;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    }
  );

  // ========== AI Operations ==========
  ipcMain.handle("ai:generate-response", async (event, data) => {
    try {
      const { aiMember, messages, summary } = data;

      if (aiMember.provider === "openai") {
        return await generateOpenAIResponse(aiMember, messages, summary);
      } else if (aiMember.provider === "anthropic") {
        return await generateAnthropicResponse(aiMember, messages, summary);
      }

      throw new Error("Unknown AI provider");
    } catch (error) {
      console.error("Error generating AI response:", error);
      throw error;
    }
  });

  ipcMain.handle("ai:update-summary", async (event, roomId) => {
    try {
      await updateRoomSummary(pool, roomId);
      return { success: true };
    } catch (error) {
      console.error("Error updating summary:", error);
      throw error;
    }
  });

  ipcMain.handle("ai:get-summary", async (event, roomId) => {
    try {
      const result = await pool.query(
        "SELECT summary FROM room_summaries WHERE room_id = $1",
        [roomId]
      );
      return result.rows[0]?.summary || "";
    } catch (error) {
      console.error("Error getting summary:", error);
      throw error;
    }
  });

  // ========== STT/TTS ==========
  ipcMain.handle("stt:transcribe", async (event, audioData) => {
    try {
      return await transcribeWithDeepgram(audioData);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "tts:synthesize",
    async (event, text, provider = "deepgram") => {
      return new Promise((resolve, reject) => {
        const providerName =
          provider === "elevenlabs" ? "elevenlabs" : "deepgram";

        queueManager.enqueueSpeechRequest({
          provider: providerName,
          text,
          onSuccess: (audio) => resolve(audio),
          onError: (error) => reject(error),
        });
      });
    }
  );

  // ========== Queue Status ==========
  ipcMain.handle("queue:status", async () => {
    try {
      return queueManager.getStatus();
    } catch (error) {
      console.error("Error getting queue status:", error);
      throw error;
    }
  });
}

// Queue AI responses using provider-level queues
async function queueAIResponses(
  pool,
  roomId,
  aiMembers,
  sender,
  replyToMessageId = null
) {
  // Get current messages and summary once for all AI members
  const messagesResult = await pool.query(
    `SELECT m.*,
            CASE 
              WHEN m.member_type = 'user' THEN u.display_name
              WHEN m.member_type = 'ai' THEN a.name
            END as member_name
     FROM messages m
     LEFT JOIN users u ON m.member_type = 'user' AND m.member_id = u.id
     LEFT JOIN ai_members a ON m.member_type = 'ai' AND m.member_id = a.id
     WHERE m.room_id = $1
     ORDER BY m.created_at DESC
     LIMIT 20`,
    [roomId]
  );

  const messages = messagesResult.rows.reverse();

  const summaryResult = await pool.query(
    "SELECT summary FROM room_summaries WHERE room_id = $1",
    [roomId]
  );
  const summary = summaryResult.rows[0]?.summary || "";

  // Fetch full AI members with encrypted API keys (needed for AI service)
  const fullAIMembersResult = await pool.query(
    "SELECT * FROM ai_members WHERE room_id = $1",
    [roomId]
  );

  const fullAIMembers = aiMembers
    .map((member) =>
      fullAIMembersResult.rows.find((full) => full.id === member.id)
    )
    .filter(Boolean);

  // Queue each AI member's response in their provider queue
  for (const aiMember of fullAIMembers) {
    queueManager.enqueueAIRequest({
      provider: aiMember.provider,
      roomId,
      aiMember,
      messages,
      summary,
      sender,
      replyToMessageId, // Pass the reply reference
      onError: (error) => {
        console.error(`Error in AI response for ${aiMember.name}:`, error);
        // Optionally send error notification to frontend
        sender.send("ai:error", {
          roomId,
          aiMemberId: aiMember.id,
          error: error.message,
        });
      },
    });
  }
}

module.exports = { setupIpcHandlers };
