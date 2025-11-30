/**
 * App Sidebar
 * 
 * Shared server navigation sidebar.
 * Shows list of servers and allows switching between them.
 */

import { useState } from 'react';
import { Button } from './primitives';
import { usePlatformAdapter } from '../adapters';
import { useSessionStore } from '../store/hooks';
import type { Server } from '@quorum/app-state';

interface ServerItemProps {
  server: Server;
  isActive: boolean;
  onSelect: () => void;
}

function ServerItem({ server, isActive, onSelect }: ServerItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        variant="unstyled"
        size="icon"
        onClick={onSelect}
        className={`
          w-12 h-12 rounded-2xl flex items-center justify-center text-off-white text-lg font-bold 
          transition-all duration-200
          ${isActive
            ? 'bg-selected rounded-xl'
            : 'bg-secondary-700 hover:bg-selected hover:rounded-xl'
          }
        `}
        title={server.name}
      >
        {server.name.charAt(0).toUpperCase()}
      </Button>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-8 bg-off-white rounded-r pointer-events-none" />
      )}

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-secondary-800 text-off-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
          <div className="font-semibold">{server.name}</div>
          {server.role && (
            <div className="text-xs text-text-tertiary">{server.role}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AppSidebar() {
  const adapter = usePlatformAdapter();
  const sessionStore = useSessionStore();
  const { servers, currentServer, setCurrentServer } = sessionStore();

  const handleServerSelect = (server: Server) => {
    if (server.id !== currentServer?.id) {
      setCurrentServer(server);
    }
  };

  const handleAddServer = async () => {
    await adapter.openAddServerFlow();
  };

  return (
    <div className="w-20 flex-shrink-0 bg-navigation flex flex-col items-center py-4 space-y-2">
      {/* Server Icons */}
      {servers.map((server) => (
        <ServerItem
          key={server.id}
          server={server}
          isActive={currentServer?.id === server.id}
          onSelect={() => handleServerSelect(server)}
        />
      ))}

      {/* Add Server Button */}
      <Button
        variant="unstyled"
        size="icon"
        onClick={handleAddServer}
        className="w-12 h-12 rounded-2xl bg-secondary-700 hover:bg-presence hover:rounded-xl flex items-center justify-center text-off-white transition-all duration-200"
        title="Add a server"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Button>

      {/* Separator */}
      {servers.length > 0 && (
        <div className="w-8 h-0.5 bg-secondary-700 my-2" />
      )}
    </div>
  );
}

