import { Response } from 'express';
import type { SSEEvent, SSEEventType } from '@quorum/types';

interface SSEClient {
  id: string;
  response: Response;
  userId: number;
  roomIds: Set<number>;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  /**
   * Register a new SSE client
   */
  addClient(clientId: string, response: Response, userId: number, roomId?: number): void {
    const client: SSEClient = {
      id: clientId,
      response,
      userId,
      roomIds: roomId ? new Set([roomId]) : new Set(),
    };

    this.clients.set(clientId, client);

    // Setup SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    this.sendToClient(clientId, {
      type: 'connected' as SSEEventType,
      data: { connection_id: clientId },
      timestamp: new Date().toISOString(),
    });

    // Send periodic ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (this.clients.has(clientId)) {
        this.sendToClient(clientId, {
          type: 'ping' as SSEEventType,
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Every 30 seconds

    // Handle client disconnect
    response.on('close', () => {
      clearInterval(pingInterval);
      this.removeClient(clientId);
    });
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch (error) {
        // Ignore errors when closing
      }
      this.clients.delete(clientId);
      console.log(`SSE client disconnected: ${clientId}`);
    }
  }

  /**
   * Subscribe client to a channel
   */
  subscribeToRoom(clientId: string, roomId: number): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.roomIds.add(roomId);
    }
  }

  /**
   * Unsubscribe client from a channel
   */
  unsubscribeFromRoom(clientId: string, roomId: number): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.roomIds.delete(roomId);
    }
  }

  /**
   * Send event to a specific client
   */
  private sendToClient(clientId: string, event: SSEEvent): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        const data = JSON.stringify(event.data);
        client.response.write(`event: ${event.type}\n`);
        client.response.write(`data: ${data}\n`);
        client.response.write(`id: ${Date.now()}\n\n`);
      } catch (error) {
        console.error(`Error sending to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Broadcast event to all clients in a channel
   */
  broadcastToRoom(roomId: number, event: SSEEvent): void {
    this.clients.forEach((client) => {
      if (client.roomIds.has(roomId)) {
        this.sendToClient(client.id, event);
      }
    });
  }

  /**
   * Broadcast event to a specific user
   */
  broadcastToUser(userId: number, event: SSEEvent): void {
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.sendToClient(client.id, event);
      }
    });
  }

  /**
   * Broadcast event to all clients
   */
  broadcastToAll(event: SSEEvent): void {
    this.clients.forEach((client) => {
      this.sendToClient(client.id, event);
    });
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients for a specific channel
   */
  getRoomClientCount(roomId: number): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.roomIds.has(roomId)) {
        count++;
      }
    });
    return count;
  }
}

// Export singleton instance
export const sseManager = new SSEManager();

