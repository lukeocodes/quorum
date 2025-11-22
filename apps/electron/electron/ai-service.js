const OpenAI = require("openai");
const Anthropic = require("@anthropic-ai/sdk");
const { getPool } = require("./database");
const { decrypt } = require("./encryption-service");

/**
 * Get API client for a specific AI member
 */
async function getClientForMember(aiMember) {
  try {
    // Decrypt the API key
    const apiKey = decrypt(aiMember.api_key_encrypted);

    if (aiMember.provider === "openai") {
      return new OpenAI({ apiKey });
    } else if (aiMember.provider === "anthropic") {
      return new Anthropic({ apiKey });
    }

    throw new Error(`Unknown provider: ${aiMember.provider}`);
  } catch (error) {
    console.error("Error creating AI client:", error);
    throw new Error("Failed to initialize AI client");
  }
}

async function generateOpenAIResponse(aiMember, messages, summary) {
  const client = await getClientForMember(aiMember);

  // Build conversation history
  const conversationMessages = messages.map((msg) => ({
    role: msg.is_user ? "user" : "assistant",
    content: msg.content,
    name: msg.is_user ? "user" : msg.ai_name?.replace(/\s+/g, "_"),
  }));

  // Build system message
  const systemMessage = buildSystemMessage(aiMember, summary);

  const response = await client.chat.completions.create({
    model: aiMember.model,
    messages: [
      { role: "system", content: systemMessage },
      ...conversationMessages,
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0].message.content;
}

async function generateAnthropicResponse(aiMember, messages, summary) {
  const client = await getClientForMember(aiMember);

  // Build conversation history
  const conversationMessages = messages.map((msg) => ({
    role: msg.is_user ? "user" : "assistant",
    content: msg.content,
  }));

  // Build system message
  const systemMessage = buildSystemMessage(aiMember, summary);

  const response = await client.messages.create({
    model: aiMember.model,
    max_tokens: 500,
    system: systemMessage,
    messages: conversationMessages,
  });

  return response.content[0].text;
}

function buildSystemMessage(aiMember, summary) {
  let systemMessage = `You are ${aiMember.name}.`;

  if (aiMember.persona) {
    systemMessage += `\n\nPersona: ${aiMember.persona}`;
  }

  if (aiMember.system_instructions) {
    systemMessage += `\n\nInstructions: ${aiMember.system_instructions}`;
  }

  if (summary) {
    systemMessage += `\n\nConversation Summary: ${summary}`;
  }

  systemMessage += `\n\nYou are participating in a group discussion with other AI assistants and humans. Provide thoughtful, concise responses that add value to the conversation. Be collaborative and respectful of other viewpoints.`;

  return systemMessage;
}

async function updateRoomSummary(pool, roomId) {
  // Get recent messages
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
     LIMIT 30`,
    [roomId]
  );

  const messages = messagesResult.rows.reverse();

  if (messages.length === 0) {
    return;
  }

  // Get current summary
  const summaryResult = await pool.query(
    "SELECT summary, message_count FROM room_summaries WHERE room_id = $1",
    [roomId]
  );

  const currentSummary = summaryResult.rows[0]?.summary || "";
  const messageCount = summaryResult.rows[0]?.message_count || 0;

  // Format recent messages for summary
  const recentMessages = messages
    .slice(-10)
    .map((msg) => {
      const speaker =
        msg.member_type === "user"
          ? msg.member_name || "User"
          : msg.member_name || "AI";
      return `${speaker}: ${msg.content}`;
    })
    .join("\n");

  // Get an AI member from this room to generate the summary
  const aiMembersResult = await pool.query(
    "SELECT * FROM ai_members WHERE room_id = $1 LIMIT 1",
    [roomId]
  );

  if (aiMembersResult.rows.length === 0) {
    return; // No AI members to generate summary
  }

  const aiMember = aiMembersResult.rows[0];

  try {
    const client = await getClientForMember(aiMember);
    let newSummary;

    if (aiMember.provider === "openai") {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a conversation summarizer. Create a concise summary of the discussion, highlighting key points and decisions. Keep it under 200 words.",
          },
          {
            role: "user",
            content: `Previous summary: ${currentSummary}\n\nRecent messages:\n${recentMessages}\n\nProvide an updated summary:`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      newSummary = response.choices[0].message.content;
    } else if (aiMember.provider === "anthropic") {
      const response = await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        system:
          "You are a conversation summarizer. Create a concise summary of the discussion, highlighting key points and decisions. Keep it under 200 words.",
        messages: [
          {
            role: "user",
            content: `Previous summary: ${currentSummary}\n\nRecent messages:\n${recentMessages}\n\nProvide an updated summary:`,
          },
        ],
      });

      newSummary = response.content[0].text;
    } else {
      return; // Unknown provider
    }

    // Update summary
    await pool.query(
      `INSERT INTO room_summaries (room_id, summary, message_count)
       VALUES ($1, $2, $3)
       ON CONFLICT (room_id) 
       DO UPDATE SET summary = $2, message_count = $3`,
      [roomId, newSummary, messages.length]
    );
  } catch (error) {
    console.error("Error updating summary:", error);
  }
}

module.exports = {
  generateOpenAIResponse,
  generateAnthropicResponse,
  updateRoomSummary,
};
