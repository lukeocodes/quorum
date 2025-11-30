import { useState, useEffect } from 'react';
import { getCurrentAccount, getCurrentToken } from '../utils/auth';

interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_color: string;
  full_name: string | null;
  title: string | null;
  pronouns: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileViewProps {
  apiUrl: string;
}

export function ProfileView({ apiUrl }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const account = getCurrentAccount();
      if (!account) {
        window.location.href = '/auth/login';
        return;
      }

      const token = getCurrentToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const userApiUrl = import.meta.env.PUBLIC_API_USER_URL || 'http://localhost:3002';
      const response = await fetch(`${userApiUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        throw new Error(data.message || 'Failed to load profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  function getInitials(user: UserProfile | null): string {
    if (!user) return '?';
    if (user.full_name) {
      const parts = user.full_name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.full_name[0].toUpperCase();
    }
    if (user.display_name) {
      return user.display_name[0].toUpperCase();
    }
    return user.username[0].toUpperCase();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-selected"></div>
        <p className="ml-4 text-text-secondary">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border-l-4 border-danger-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-danger-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-danger-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-subtle rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
          <a
            href="/profile/edit"
            className="px-4 py-2 bg-selected text-text-inverse rounded-lg hover:bg-selected/90 focus:outline-none focus:ring-2 focus:ring-selected focus:ring-offset-2 transition-colors font-medium"
          >
            Edit Profile
          </a>
        </div>

        {/* Avatar */}
        <div className="flex items-center mb-8 pb-8 border-b border-border">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-3xl"
            style={{ backgroundColor: profile.avatar_color }}
          >
            {getInitials(profile)}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {profile.full_name || profile.display_name || profile.username}
            </h2>
            {profile.display_name && (
              <p className="text-text-secondary">@{profile.username}</p>
            )}
            {profile.title && (
              <p className="text-text-secondary mt-1">{profile.title}</p>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Username
            </label>
            <p className="text-text-primary">{profile.username}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <p className="text-text-primary">{profile.email}</p>
          </div>

          {profile.display_name && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Display Name
              </label>
              <p className="text-text-primary">{profile.display_name}</p>
            </div>
          )}

          {profile.full_name && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Full Name
              </label>
              <p className="text-text-primary">{profile.full_name}</p>
            </div>
          )}

          {profile.title && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Title
              </label>
              <p className="text-text-primary">{profile.title}</p>
            </div>
          )}

          {profile.pronouns && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Pronouns
              </label>
              <p className="text-text-primary">{profile.pronouns}</p>
            </div>
          )}

          {profile.timezone && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Timezone
              </label>
              <p className="text-text-primary">{profile.timezone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

