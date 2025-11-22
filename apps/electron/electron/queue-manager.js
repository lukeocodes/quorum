/**
 * Queue Manager - Provider-level request queuing
 *
 * This module manages separate queues for each AI provider to:
 * - Prevent rate limiting by processing requests sequentially per provider
 * - Allow parallel processing across different providers
 * - Enable concurrent multi-room discussions
 */

class ProviderQueue {
  constructor(providerName) {
    this.providerName = providerName;
    this.queue = [];
    this.processing = false;
  }

  /**
   * Add a request to the queue
   * @param {Object} request - Request object containing roomId, aiMember, context, callback
   */
  enqueue(request) {
    this.queue.push(request);
    console.log(
      `[${this.providerName}] Enqueued request. Queue length: ${this.queue.length}`
    );

    if (!this.processing) {
      this.processNext();
    }
  }

  /**
   * Process the next request in the queue
   */
  async processNext() {
    if (this.queue.length === 0) {
      this.processing = false;
      console.log(`[${this.providerName}] Queue empty`);
      return;
    }

    this.processing = true;
    const request = this.queue.shift();

    console.log(
      `[${this.providerName}] Processing request for room ${request.roomId}, AI: ${request.aiMember.name}`
    );

    try {
      // Execute the request
      await request.execute();
    } catch (error) {
      console.error(`[${this.providerName}] Error processing request:`, error);

      // Notify about the error
      if (request.onError) {
        request.onError(error);
      }
    }

    // Process next request after a small delay to avoid rate limits
    setTimeout(() => {
      this.processNext();
    }, 500); // 500ms delay between requests
  }

  /**
   * Get current queue length
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Check if queue is processing
   */
  isProcessing() {
    return this.processing;
  }
}

class QueueManager {
  constructor() {
    this.queues = {
      openai: new ProviderQueue("OpenAI"),
      anthropic: new ProviderQueue("Anthropic"),
      deepgram: new ProviderQueue("Deepgram"),
      elevenlabs: new ProviderQueue("ElevenLabs"),
    };
  }

  /**
   * Add an AI generation request to the appropriate provider queue
   * @param {Object} params - Request parameters
   */
  enqueueAIRequest({
    provider,
    roomId,
    aiMember,
    messages,
    summary,
    replyToMessageId,
    onSuccess,
    onError,
    sender,
  }) {
    const queue = this.queues[provider];

    if (!queue) {
      console.error(`Unknown provider: ${provider}`);
      if (onError) onError(new Error(`Unknown provider: ${provider}`));
      return;
    }

    const request = {
      roomId,
      aiMember,
      execute: async () => {
        const {
          generateOpenAIResponse,
          generateAnthropicResponse,
        } = require("./ai-service");
        const { getPool } = require("./database");
        const pool = getPool();

        try {
          // Generate AI response
          let responseContent;
          if (provider === "openai") {
            responseContent = await generateOpenAIResponse(
              aiMember,
              messages,
              summary
            );
          } else if (provider === "anthropic") {
            responseContent = await generateAnthropicResponse(
              aiMember,
              messages,
              summary
            );
          }

          // Save to database with polymorphic member reference
          const result = await pool.query(
            "INSERT INTO messages (room_id, member_type, member_id, content, reply_to_message_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [roomId, "ai", aiMember.id, responseContent, replyToMessageId]
          );

          const aiMessage = {
            ...result.rows[0],
            member_name: aiMember.name,
            member_avatar_color: aiMember.avatar_color,
          };

          // Send to renderer
          if (sender) {
            sender.send("ai:response", aiMessage);
          }

          // Update summary in background
          const { updateRoomSummary } = require("./ai-service");
          updateRoomSummary(pool, roomId).catch((err) =>
            console.error("Error updating summary:", err)
          );

          if (onSuccess) {
            onSuccess(aiMessage);
          }
        } catch (error) {
          throw error; // Will be caught by processNext
        }
      },
      onError,
    };

    queue.enqueue(request);
  }

  /**
   * Add a speech synthesis request to the appropriate provider queue
   * @param {Object} params - Request parameters
   */
  enqueueSpeechRequest({ provider, text, onSuccess, onError }) {
    const queue = this.queues[provider];

    if (!queue) {
      console.error(`Unknown provider: ${provider}`);
      if (onError) onError(new Error(`Unknown provider: ${provider}`));
      return;
    }

    const request = {
      roomId: null,
      aiMember: { name: "Speech Synthesis" },
      execute: async () => {
        const {
          synthesizeWithDeepgram,
          synthesizeWithElevenlabs,
        } = require("./speech-service");

        let audio;
        if (provider === "deepgram") {
          audio = await synthesizeWithDeepgram(text);
        } else if (provider === "elevenlabs") {
          audio = await synthesizeWithElevenlabs(text);
        }

        if (onSuccess) {
          onSuccess(audio);
        }
      },
      onError,
    };

    queue.enqueue(request);
  }

  /**
   * Get status of all queues
   */
  getStatus() {
    return {
      openai: {
        queueLength: this.queues.openai.getQueueLength(),
        processing: this.queues.openai.isProcessing(),
      },
      anthropic: {
        queueLength: this.queues.anthropic.getQueueLength(),
        processing: this.queues.anthropic.isProcessing(),
      },
      deepgram: {
        queueLength: this.queues.deepgram.getQueueLength(),
        processing: this.queues.deepgram.isProcessing(),
      },
      elevenlabs: {
        queueLength: this.queues.elevenlabs.getQueueLength(),
        processing: this.queues.elevenlabs.isProcessing(),
      },
    };
  }
}

// Singleton instance
const queueManager = new QueueManager();

module.exports = { queueManager };
