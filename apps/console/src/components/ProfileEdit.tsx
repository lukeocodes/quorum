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

interface ProfileEditProps {
  apiUrl: string;
}

export function ProfileEdit({ apiUrl }: ProfileEditProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [timezone, setTimezone] = useState('');

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
        const prof = data.data;
        setProfile(prof);
        setDisplayName(prof.display_name || '');
        setFullName(prof.full_name || '');
        setTitle(prof.title || '');
        setPronouns(prof.pronouns || '');
        setTimezone(prof.timezone || '');
      } else {
        throw new Error(data.message || 'Failed to load profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getCurrentToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const userApiUrl = import.meta.env.PUBLIC_API_USER_URL || 'http://localhost:3002';
      const response = await fetch(`${userApiUrl}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName || null,
          full_name: fullName || null,
          title: title || null,
          pronouns: pronouns || null,
          timezone: timezone || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setProfile(data.data);
        // Redirect to profile view after a short delay
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1000);
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-subtle rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Edit Profile</h1>
          <a
            href="/profile"
            className="px-4 py-2 bg-border text-text-primary rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors font-medium"
          >
            Cancel
          </a>
        </div>

        {/* Avatar (read-only) */}
        <div className="flex items-center mb-8 pb-8 border-b border-border">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-3xl"
            style={{ backgroundColor: profile.avatar_color }}
          >
            {getInitials(profile)}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {fullName || displayName || profile.username}
            </h2>
            <p className="text-text-secondary">@{profile.username}</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-success-50 border-l-4 border-success-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-success-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-success-800">Profile updated successfully!</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
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
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
              Username (read-only)
            </label>
            <input
              type="text"
              id="username"
              value={profile.username}
              disabled
              className="w-full px-4 py-3 border border-border rounded-md bg-muted text-text-secondary cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              Email (read-only)
            </label>
            <input
              type="email"
              id="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 border border-border rounded-md bg-muted text-text-secondary cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-text-primary mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., lukeocodes"
              className="w-full px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent transition-colors"
            />
            <p className="mt-1 text-sm text-text-secondary">This is your display name (can be different per server)</p>
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-text-primary mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Luke Oliff"
              className="w-full px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., CEO / Founder"
              className="w-full px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="pronouns" className="block text-sm font-medium text-text-primary mb-2">
              Pronouns
            </label>
            <input
              type="text"
              id="pronouns"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="e.g., he/him"
              className="w-full px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-text-primary mb-2">
              Timezone (IANA format)
            </label>
            <input
              type="text"
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g., Europe/London"
              className="w-full px-4 py-3 border border-border rounded-md focus:ring-2 focus:ring-selected focus:border-transparent transition-colors"
            />
            <p className="mt-1 text-sm text-text-secondary">IANA timezone identifier (e.g., Europe/London, America/New_York)</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <a
              href="/profile"
              className="px-6 py-3 bg-border text-text-primary rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors font-medium"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-selected text-text-inverse rounded-lg hover:bg-selected/90 focus:outline-none focus:ring-2 focus:ring-selected focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

