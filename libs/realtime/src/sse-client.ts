import type {
  RealtimeConfig,
  RealtimeEvent,
  SSEEventType,
  ConnectionState,
  EventHandler,
  ConnectionStateHandler,
  ErrorHandler,
} from './types';

const DEFAULT_EVENT_TYPES: SSEEventType[] = [
  'connected',
  'ping',
  'message',
  'message_deleted',
  'typing_start',
  'typing_stop',
  'member_join',
  'member_leave',
  'ai_response_start',
  'ai_response_chunk',
  'ai_response_end',
  'ai_response_error',
  'channel_updated',
  'channel_deleted',
  'server_updated',
];

/**
 * SSE Client with automatic reconnection and event management
 */
export class SSEClient {
  private config: Required<RealtimeConfig>;
  private eventSource: EventSource | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Event handlers
  private eventHandlers: Map<SSEEventType | '*', Set<EventHandler>> = new Map();
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  
  // Current subscription info
  private currentEndpoint: string | null = null;

  constructor(config: RealtimeConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      token: config.token || '',
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      initialReconnectDelay: config.initialReconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
    };
  }

  /**
   * Update the authentication token
   */
  setToken(token: string): void {
    this.config.token = token;
    // Reconnect with new token if currently connected
    if (this.currentEndpoint && this.connectionState === 'connected') {
      this.reconnect();
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Subscribe to a specific channel's events
   */
  subscribeToChannel(channelId: number): void {
    this.connect(`/sse/channels/${channelId}`);
  }

  /**
   * Subscribe to all user updates
   */
  subscribeToUpdates(): void {
    this.connect('/sse/subscribe');
  }

  /**
   * Connect to a specific SSE endpoint
   */
  private connect(endpoint: string): void {
    this.disconnect();
    this.currentEndpoint = endpoint;
    this.setConnectionState('connecting');

    const url = new URL(endpoint, this.config.baseUrl);
    
    // Note: Browser EventSource doesn't support custom headers
    // Token is typically passed via cookie or query param for SSE
    if (this.config.token) {
      url.searchParams.set('token', this.config.token);
    }

    try {
      this.eventSource = new EventSource(url.toString());
      this.setupEventListeners();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to create EventSource'));
    }
  }

  /**
   * Setup event listeners on the EventSource
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onerror = () => {
      this.handleError(new Error('SSE connection error'));
      
      if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        this.setConnectionState('disconnected');
      }
    };

    // Listen for all event types
    DEFAULT_EVENT_TYPES.forEach((type) => {
      this.eventSource?.addEventListener(type, (e: Event) => {
        const messageEvent = e as MessageEvent;
        try {
          const data = JSON.parse(messageEvent.data);
          const event: RealtimeEvent = {
            type,
            data,
            timestamp: new Date().toISOString(),
          };
          this.emitEvent(event);
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      });
    });
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.setConnectionState('reconnecting');
    
    const delay = Math.min(
      this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );
    
    this.reconnectAttempts++;
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentEndpoint) {
        this.connect(this.currentEndpoint);
      }
    }, delay);
  }

  /**
   * Manually trigger a reconnection
   */
  reconnect(): void {
    if (this.currentEndpoint) {
      this.reconnectAttempts = 0;
      this.connect(this.currentEndpoint);
    }
  }

  /**
   * Disconnect from the SSE stream
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.setConnectionState('disconnected');
    this.currentEndpoint = null;
  }

  /**
   * Add an event handler for a specific event type
   */
  on<T = unknown>(type: SSEEventType | '*', handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    this.eventHandlers.get(type)!.add(handler as EventHandler);
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(type)?.delete(handler as EventHandler);
    };
  }

  /**
   * Add a handler for specific event type (alias for on)
   */
  addEventListener<T = unknown>(type: SSEEventType, handler: EventHandler<T>): () => void {
    return this.on(type, handler);
  }

  /**
   * Add a connection state change handler
   */
  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.add(handler);
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  /**
   * Add an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Emit an event to all handlers
   */
  private emitEvent(event: RealtimeEvent): void {
    // Emit to specific type handlers
    this.eventHandlers.get(event.type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
    
    // Emit to wildcard handlers
    this.eventHandlers.get('*')?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in wildcard event handler:', error);
      }
    });
  }

  /**
   * Update and emit connection state changes
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionStateHandlers.forEach((handler) => {
        try {
          handler(state);
        } catch (error) {
          console.error('Error in connection state handler:', error);
        }
      });
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });
  }
}

