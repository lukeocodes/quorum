import type {
  ApiResponse,
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ValidateTokenResponse,
  CreateServerRequest,
  CreateServerResponse,
  UpdateServerRequest,
  GetServersResponse,
  GetServerResponse,
  CreateInviteRequest,
  CreateInviteResponse,
  JoinServerResponse,
} from '@quorum/proto';

export interface QuorumAuthClientConfig {
  baseUrl: string;
  token?: string;
  onTokenChange?: (token: string | null) => void;
}

/**
 * Client SDK for Quorum API Core (auth, identity, discovery, server directory)
 */
export class QuorumAuthClient {
  private baseUrl: string;
  private token: string | null = null;
  private onTokenChange?: (token: string | null) => void;

  constructor(config: QuorumAuthClientConfig) {
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

  // ========== Authentication ==========

  async signup(data: SignupRequest): Promise<SignupResponse> {
    const response = await this.request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.data) {
      this.setToken(response.data.token);
      return response.data;
    }
    throw new Error('Signup failed');
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.data) {
      this.setToken(response.data.token);
      return response.data;
    }
    throw new Error('Login failed');
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
  }

  async getCurrentUser(): Promise<ValidateTokenResponse> {
    const response = await this.request<ValidateTokenResponse>('/auth/me');
    if (response.data) {
      return response.data;
    }
    throw new Error('Failed to get current user');
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const response = await this.request<ValidateTokenResponse>('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (response.data) {
      return response.data;
    }
    throw new Error('Token validation failed');
  }

  // ========== Servers (Directory) ==========

  async getServers(): Promise<GetServersResponse> {
    const response = await this.request<GetServersResponse>('/servers');
    return response.data || { servers: [] };
  }

  async createServer(data: CreateServerRequest): Promise<CreateServerResponse> {
    const response = await this.request<CreateServerResponse>('/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async getServer(serverId: number): Promise<GetServerResponse> {
    const response = await this.request<GetServerResponse>(`/servers/${serverId}`);
    return response.data!;
  }

  async updateServer(serverId: number, data: UpdateServerRequest): Promise<CreateServerResponse> {
    const response = await this.request<CreateServerResponse>(`/servers/${serverId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteServer(serverId: number): Promise<void> {
    await this.request(`/servers/${serverId}`, {
      method: 'DELETE',
    });
  }

  async getServerMembers(serverId: number): Promise<any> {
    const response = await this.request(`/servers/${serverId}/members`);
    return response.data;
  }

  async createInvite(serverId: number, data: CreateInviteRequest): Promise<CreateInviteResponse> {
    const response = await this.request<CreateInviteResponse>(`/servers/${serverId}/invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async joinServerWithInvite(code: string): Promise<JoinServerResponse> {
    const response = await this.request<JoinServerResponse>(`/servers/join/${code}`, {
      method: 'POST',
    });
    return response.data!;
  }

  async leaveServer(serverId: number): Promise<void> {
    await this.request(`/servers/${serverId}/leave`, {
      method: 'POST',
    });
  }

  // ========== Discovery ==========

  async getPublicServers(): Promise<GetServersResponse> {
    const response = await this.request<GetServersResponse>('/discovery/public');
    return response.data || { servers: [] };
  }

  async joinPublicServer(serverId: number): Promise<any> {
    const response = await this.request(`/discovery/public/${serverId}/join`, {
      method: 'POST',
    });
    return response.data;
  }
}

// For backwards compatibility, also export as QuorumApiClient
export { QuorumAuthClient as QuorumApiClient };
export type { QuorumAuthClientConfig as QuorumApiClientConfig };
