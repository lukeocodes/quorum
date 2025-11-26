import type {
  ApiResponse,
  CreateChannelRequest,
  CreateChannelResponse,
  UpdateChannelRequest,
  GetChannelsResponse,
  GetChannelResponse,
  ShareChannelRequest,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  GetMessageContextResponse,
  CreateAIMemberRequest,
  CreateAIMemberResponse,
  UpdateAIMemberRequest,
  GetAIMembersResponse,
  GetAIMemberResponse,
  SSEEvent,
} from '@quorum/proto';

export interface QuorumServerClientConfig {
  baseUrl: string;
  token?: string;
  onTokenChange?: (token: string | null) => void;
}

/**
 * Client SDK for Quorum API Server (channels, messages, ai-members, real-time)
 */
export class QuorumServerClient {
  private baseUrl: string;
  private token: string | null = null;
  private onTokenChange?: (token: string | null) => void;

  constructor(config: QuorumServerClientConfig) {
    this.baseUrl = config.baseUrl;
    this.token = config.token || null;
    this.onTokenChange = config.onTokenChange;
  }

  /**
   * Set the authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (this.onTokenChange) {
      this.onTokenChange(token);
    }
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Make a request to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }

  // ========== Channels ==========

  async getChannels(serverId: number): Promise<GetChannelsResponse> {
    const response = await this.request<GetChannelsResponse>(`/servers/${serverId}/channels`);
    return response.data || { channels: [] };
  }

  async createChannel(serverId: number, data: CreateChannelRequest): Promise<CreateChannelResponse> {
    const response = await this.request<CreateChannelResponse>(`/servers/${serverId}/channels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async getChannel(channelId: number): Promise<GetChannelResponse> {
    const response = await this.request<GetChannelResponse>(`/channels/${channelId}`);
    return response.data!;
  }

  async updateChannel(channelId: number, data: UpdateChannelRequest): Promise<CreateChannelResponse> {
    const response = await this.request<CreateChannelResponse>(`/channels/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteChannel(channelId: number): Promise<void> {
    await this.request(`/channels/${channelId}`, {
      method: 'DELETE',
    });
  }

  async shareChannel(channelId: number, data: ShareChannelRequest): Promise<void> {
    await this.request(`/channels/${channelId}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========== Messages ==========

  async getMessages(channelId: number, params?: GetMessagesRequest): Promise<GetMessagesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.before) queryParams.append('before', params.before);
    if (params?.after) queryParams.append('after', params.after);

    const query = queryParams.toString();
    const endpoint = `/channels/${channelId}/messages${query ? `?${query}` : ''}`;

    const response = await this.request<GetMessagesResponse>(endpoint);
    return response.data!;
  }

  async sendMessage(channelId: number, data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await this.request<SendMessageResponse>(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async getMessageContext(messageId: number, contextSize?: number): Promise<GetMessageContextResponse> {
    const query = contextSize ? `?size=${contextSize}` : '';
    const response = await this.request<GetMessageContextResponse>(`/messages/${messageId}/context${query}`);
    return response.data!;
  }

  // ========== AI Members ==========

  async getAIMembers(channelId: number): Promise<GetAIMembersResponse> {
    const response = await this.request<GetAIMembersResponse>(`/channels/${channelId}/ai-members`);
    return response.data || { ai_members: [] };
  }

  async createAIMember(channelId: number, data: CreateAIMemberRequest): Promise<CreateAIMemberResponse> {
    const response = await this.request<CreateAIMemberResponse>(`/channels/${channelId}/ai-members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async getAIMember(aiMemberId: number): Promise<GetAIMemberResponse> {
    const response = await this.request<GetAIMemberResponse>(`/ai-members/${aiMemberId}`);
    return response.data!;
  }

  async updateAIMember(aiMemberId: number, data: UpdateAIMemberRequest): Promise<CreateAIMemberResponse> {
    const response = await this.request<CreateAIMemberResponse>(`/ai-members/${aiMemberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteAIMember(aiMemberId: number): Promise<void> {
    await this.request(`/ai-members/${aiMemberId}`, {
      method: 'DELETE',
    });
  }

  // ========== SSE (Server-Sent Events) ==========

  /**
   * Subscribe to channel updates via SSE
   */
  subscribeToChannel(
    channelId: number,
    onEvent: (event: SSEEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(
      `${this.baseUrl}/sse/channels/${channelId}`,
      {
        // @ts-ignore - EventSource doesn't support headers in the browser, but does in Node.js
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
      }
    );

    // Listen for all event types
    const eventTypes = [
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
      'server_updated',
    ];

    eventTypes.forEach((type) => {
      eventSource.addEventListener(type, (e: any) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({
            type: type as any,
            data,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      });
    });

    eventSource.onerror = () => {
      if (onError) {
        onError(new Error('SSE connection error'));
      }
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  /**
   * Subscribe to all user updates via SSE
   */
  subscribeToUpdates(
    onEvent: (event: SSEEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(
      `${this.baseUrl}/sse/subscribe`,
      {
        // @ts-ignore
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
      }
    );

    const eventTypes = [
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

    eventTypes.forEach((type) => {
      eventSource.addEventListener(type, (e: any) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({
            type: type as any,
            data,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      });
    });

    eventSource.onerror = () => {
      if (onError) {
        onError(new Error('SSE connection error'));
      }
    };

    return () => {
      eventSource.close();
    };
  }
}

