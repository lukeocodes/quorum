import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faRightToBracket, faGlobe, faArrowRightFromBracket, faServer } from '@fortawesome/free-solid-svg-icons';

export const ServerSelection = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPublicServers, setShowPublicServers] = useState(false);
  
  const user = useAppStore((state) => state.user);
  const authToken = useAppStore((state) => state.authToken);
  const setCurrentServer = useAppStore((state) => state.setCurrentServer);
  const setUser = useAppStore((state) => state.setUser);
  const setAuthToken = useAppStore((state) => state.setAuthToken);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const userServers = await window.electronAPI.getUserServers();
      setServers(userServers);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectServer = (server: any) => {
    setCurrentServer(server);
  };

  const handleLogout = async () => {
    if (authToken) {
      await window.electronAPI.logout(authToken);
      localStorage.removeItem('authToken');
      setUser(null);
      setAuthToken(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-text-primary">Loading servers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Welcome, {user?.display_name || user?.username}!
            </h1>
            <p className="text-text-tertiary">Select a server to get started</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-subtle hover:bg-subtle text-text-secondary rounded-md transition-colors border border-border"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-3 p-6 bg-selected hover:bg-selected/90 text-text-primary rounded-lg transition-colors font-semibold"
          >
            <FontAwesomeIcon icon={faPlus} className="w-6 h-6" />
            <span className="font-medium">Create Server</span>
          </button>
          
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center justify-center gap-3 p-6 bg-selected hover:bg-selected/90 text-text-primary rounded-lg transition-colors font-semibold"
          >
            <FontAwesomeIcon icon={faRightToBracket} className="w-6 h-6" />
            <span className="font-medium">Join with Invite</span>
          </button>
          
          <button
            onClick={() => setShowPublicServers(true)}
            className="flex items-center justify-center gap-3 p-6 bg-subtle hover:bg-subtle text-text-primary rounded-lg transition-colors border border-border font-semibold"
          >
            <FontAwesomeIcon icon={faGlobe} className="w-6 h-6" />
            <span className="font-medium">Browse Public Servers</span>
          </button>
        </div>

        {/* Server List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-text-tertiary">
              <p>No servers yet. Create or join one to get started!</p>
            </div>
          ) : (
            servers.map((server) => (
              <button
                key={server.id}
                onClick={() => handleSelectServer(server)}
                className="p-6 bg-subtle hover:bg-subtle rounded-lg text-left transition-colors group border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-text-primary group-hover:text-selected transition-colors">
                    {server.name}
                  </h3>
                  {server.is_public && (
                    <span className="text-xs bg-selected/20 text-selected px-2 py-1 rounded">
                      Public
                    </span>
                  )}
                </div>
                {server.description && (
                  <p className="text-text-tertiary text-sm mb-3 line-clamp-2">
                    {server.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Role: {server.role}</span>
                  <span>Owner: {server.owner_username}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Create Server Modal */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(server) => {
            setShowCreateModal(false);
            handleSelectServer(server);
          }}
        />
      )}

      {/* Join Server Modal */}
      {showJoinModal && (
        <JoinServerModal
          onClose={() => setShowJoinModal(false)}
          onJoined={(server) => {
            setShowJoinModal(false);
            loadServers();
          }}
        />
      )}

      {/* Public Servers Modal */}
      {showPublicServers && (
        <PublicServersModal
          onClose={() => setShowPublicServers(false)}
          onJoined={(server) => {
            setShowPublicServers(false);
            loadServers();
          }}
        />
      )}
    </div>
  );
};

// Create Server Modal Component
const CreateServerModal = ({ onClose, onCreated }: any) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const server = await window.electronAPI.createServer(name, description, isPublic);
      onCreated(server);
    } catch (err: any) {
      setError(err.message || 'Failed to create server');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-subtle/50 flex items-center justify-center p-4 z-50">
      <div className="bg-subtle rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Create Server</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Server Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-text-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-text-primary"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isPublic" className="text-sm text-text-secondary">
              Make this server public (anyone can join)
            </label>
          </div>

          {error && (
            <div className="bg-notification/50 border border-notification text-text-primary px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-subtle hover:bg-border text-text-primary rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-selected hover:bg-subtle text-text-primary rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Join Server Modal Component
const JoinServerModal = ({ onClose, onJoined }: any) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const server = await window.electronAPI.joinServerWithInvite(inviteCode);
      onJoined(server);
    } catch (err: any) {
      setError(err.message || 'Failed to join server');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-subtle/50 flex items-center justify-center p-4 z-50">
      <div className="bg-subtle rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Join Server</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-md text-text-primary"
              placeholder="Enter invite code"
              required
            />
          </div>

          {error && (
            <div className="bg-notification/50 border border-notification text-text-primary px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-subtle hover:bg-border text-text-primary rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-text-primary rounded-md disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Public Servers Modal Component
const PublicServersModal = ({ onClose, onJoined }: any) => {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPublicServers();
  }, []);

  const loadPublicServers = async () => {
    try {
      const publicServers = await window.electronAPI.getPublicServers(50, 0);
      setServers(publicServers);
    } catch (err: any) {
      setError(err.message || 'Failed to load public servers');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (serverId: number) => {
    try {
      const server = await window.electronAPI.joinPublicServer(serverId);
      onJoined(server);
    } catch (err: any) {
      setError(err.message || 'Failed to join server');
    }
  };

  return (
    <div className="fixed inset-0 bg-subtle/50 flex items-center justify-center p-4 z-50">
      <div className="bg-subtle rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Public Servers</h2>
        
        {loading ? (
          <div className="text-center py-8 text-text-tertiary">Loading...</div>
        ) : servers.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">No public servers available</div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={server.id}
                className="p-4 bg-subtle rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{server.name}</h3>
                  {server.description && (
                    <p className="text-sm text-text-tertiary mt-1">{server.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                    <span>Owner: {server.owner_username}</span>
                    <span>{server.member_count} members</span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(server.id)}
                  className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-text-primary rounded-md"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-notification/50 border border-notification text-text-primary px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-subtle hover:bg-border text-text-primary rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

