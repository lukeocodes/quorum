/**
 * App Topbar
 * 
 * Shared top navigation bar showing current server name.
 */

import { useSessionStore } from '../store/hooks';

export default function AppTopbar() {
  const sessionStore = useSessionStore();
  const { currentServer } = sessionStore();

  return (
    <div className="h-10 bg-navigation border-b border-border-dark flex items-center justify-center px-6 w-full">
      {currentServer ? (
        <div className="flex items-center space-x-3">
          <h1 className="text-sm font-light text-text-inverse">
            {currentServer.name}
          </h1>
        </div>
      ) : (
        <h1 className="text-sm font-light text-text-inverse">
          Quorum
        </h1>
      )}
    </div>
  );
}

