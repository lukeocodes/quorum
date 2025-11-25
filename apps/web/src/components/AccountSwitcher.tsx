import { useState, useEffect, useRef } from 'react';
import type { User } from '@quorum/types';
import { Button } from '@quorum/components';
import { getAccounts, switchAccount, logoutCurrentAccount, getCurrentAccount } from '../utils/auth';
import type { StoredAccount } from '../utils/auth';

interface AccountSwitcherProps {
  apiUrl: string;
  onAccountSwitch?: () => void;
}

export function AccountSwitcher({ apiUrl, onAccountSwitch }: AccountSwitcherProps) {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<StoredAccount | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function loadAccounts() {
    const store = getAccounts();
    setAccounts(store.accounts);
    setCurrentAccount(getCurrentAccount());
  }

  function handleSwitch(userId: number) {
    if (currentAccount?.user.id === userId) {
      setIsOpen(false);
      return;
    }

    switchAccount(userId);
    loadAccounts();
    setIsOpen(false);
    
    // Trigger callback and reload page to refresh data
    if (onAccountSwitch) {
      onAccountSwitch();
    }
    window.location.reload();
  }

  async function handleLogout(userId: number, e: React.MouseEvent) {
    e.stopPropagation();
    
    if (accounts.length === 1) {
      // Last account - redirect to login
      await logoutCurrentAccount(apiUrl);
      window.location.href = '/auth/login';
    } else {
      // Multiple accounts - just remove this one
      await logoutCurrentAccount(apiUrl);
      loadAccounts();
    }
  }

  function handleAddAccount() {
    // Redirect to login with a special parameter
    window.location.href = '/auth/login?add_account=true';
  }

  if (!currentAccount) {
    return null;
  }

  const getInitials = (user: User) => {
    if (user.display_name) {
      const parts = user.display_name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.display_name.substring(0, 2).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Account Button */}
      <Button
        variant="unstyled"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-subtle transition-colors"
        aria-label="Account switcher"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-off-white text-sm font-semibold"
          style={{ backgroundColor: currentAccount.user.avatar_color }}
        >
          {getInitials(currentAccount.user)}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-text-primary">
            {currentAccount.user.display_name}
          </div>
          <div className="text-xs text-text-secondary">
            @{currentAccount.user.username}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-off-white rounded-lg shadow-xl border border-border py-2 z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase">Accounts</p>
          </div>

          {/* Account List */}
          <div className="max-h-80 overflow-y-auto">
            {accounts.map((account) => (
              <div
                key={account.user.id}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-subtle transition-colors group"
              >
                <Button
                  variant="unstyled"
                  onClick={() => handleSwitch(account.user.id)}
                  className="flex items-center space-x-3 flex-1 text-left"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: account.user.avatar_color }}
                  >
                    {getInitials(account.user)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary flex items-center">
                      {account.user.display_name}
                      {currentAccount.user.id === account.user.id && (
                        <span className="ml-2 px-2 py-0.5 bg-success-100 text-success-800 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary">@{account.user.username}</div>
                    <div className="text-xs text-text-tertiary">{account.user.email}</div>
                  </div>
                </Button>
                <Button
                  variant="unstyled"
                  size="icon"
                  onClick={(e) => handleLogout(account.user.id, e)}
                  className="ml-2 p-1 text-text-tertiary hover:text-danger-600 transition-colors"
                  aria-label="Logout"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </Button>
              </div>
            ))}
          </div>

          {/* Add Account Button */}
          <div className="border-t border-border mt-2">
            <Button
              variant="unstyled"
              fullWidth
              onClick={handleAddAccount}
              className="px-4 py-3 flex items-center space-x-3 hover:bg-subtle transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-border text-muted">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">Add another account</div>
                <div className="text-xs text-text-secondary">Sign in with a different account</div>
              </div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

