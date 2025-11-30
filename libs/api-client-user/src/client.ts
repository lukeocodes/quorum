import type { ApiResponse } from '@quorum/proto';

export interface QuorumUserClientConfig {
  baseUrl: string;
  token?: string;
  onTokenChange?: (token: string | null) => void;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UserPreference {
  id: number;
  user_id: number;
  preference_key: string;
  preference_value: string;
  server_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelSection {
  id: string;
  name: string;
  channelIds: number[];
  collapsed: boolean;
}

/**
 * Client SDK for Quorum API User (user profiles, preferences, app customization)
 */
export class QuorumUserClient {
  private baseUrl: string;
  private token: string | null = null;
  private onTokenChange?: (token: string | null) => void;

  constructor(config: QuorumUserClientConfig) {
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

  // ========== User Profile ==========

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    const response = await this.request<UserProfile>('/users/me');
    return response.data!;
  }

  /**
   * Update current user profile
   */
  async updateUserProfile(updates: UserProfileUpdate): Promise<UserProfile> {
    const response = await this.request<UserProfile>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  // ========== Preferences ==========

  /**
   * Get all user preferences
   */
  async getAllPreferences(): Promise<UserPreference[]> {
    const response = await this.request<{ preferences: UserPreference[] }>('/preferences');
    return response.data?.preferences || [];
  }

  /**
   * Get app-level preferences (no server context)
   */
  async getAppPreferences(): Promise<Record<string, string>> {
    const response = await this.request<{ preferences: Record<string, string> }>('/preferences/app');
    return response.data?.preferences || {};
  }

  /**
   * Set an app-level preference
   */
  async setAppPreference(key: string, value: string | any): Promise<UserPreference> {
    const response = await this.request<{ preference: UserPreference }>(`/preferences/app/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    return response.data!.preference;
  }

  /**
   * Get server-specific preferences
   */
  async getServerPreferences(serverId: number): Promise<Record<string, string>> {
    const response = await this.request<{ preferences: Record<string, string> }>(
      `/preferences/server/${serverId}`
    );
    return response.data?.preferences || {};
  }

  /**
   * Set a server-specific preference
   */
  async setServerPreference(
    serverId: number,
    key: string,
    value: string | any
  ): Promise<UserPreference> {
    const response = await this.request<{ preference: UserPreference }>(
      `/preferences/server/${serverId}/${key}`,
      {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }
    );
    return response.data!.preference;
  }

  /**
   * Delete a preference
   */
  async deletePreference(key: string, serverId?: number): Promise<boolean> {
    const query = serverId !== undefined ? `?serverId=${serverId}` : '';
    const response = await this.request<{ deleted: boolean }>(`/preferences/${key}${query}`, {
      method: 'DELETE',
    });
    return response.data?.deleted || false;
  }

  // ========== Channel Sections ==========

  /**
   * Get channel sections for a server
   */
  async getChannelSections(serverId: number): Promise<ChannelSection[]> {
    const response = await this.request<{ sections: ChannelSection[] }>(
      `/sections/server/${serverId}`
    );
    return response.data?.sections || [];
  }

  /**
   * Update channel sections for a server
   */
  async updateChannelSections(serverId: number, sections: ChannelSection[]): Promise<void> {
    await this.request(`/sections/server/${serverId}`, {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    });
  }
}

