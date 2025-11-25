import type { User } from '@quorum/types';

export interface StoredAccount {
  user: User;
  token: string;
  addedAt: number;
}

export interface AccountsStore {
  accounts: StoredAccount[];
  currentUserId: number | null;
}

const STORAGE_KEY = 'quorum_accounts';

/**
 * Get all stored accounts
 */
export function getAccounts(): AccountsStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { accounts: [], currentUserId: null };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get accounts:', error);
    return { accounts: [], currentUserId: null };
  }
}

/**
 * Save accounts to storage
 */
function saveAccounts(store: AccountsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to save accounts:', error);
  }
}

/**
 * Add or update an account
 */
export function addAccount(user: User, token: string): void {
  const store = getAccounts();
  
  // Check if account already exists
  const existingIndex = store.accounts.findIndex(acc => acc.user.id === user.id);
  
  if (existingIndex >= 0) {
    // Update existing account
    store.accounts[existingIndex] = {
      user,
      token,
      addedAt: store.accounts[existingIndex].addedAt, // Keep original addedAt
    };
  } else {
    // Add new account
    store.accounts.push({
      user,
      token,
      addedAt: Date.now(),
    });
  }
  
  // Set as current user
  store.currentUserId = user.id;
  saveAccounts(store);
}

/**
 * Remove an account
 */
export function removeAccount(userId: number): void {
  const store = getAccounts();
  store.accounts = store.accounts.filter(acc => acc.user.id !== userId);
  
  // If we removed the current user, switch to the first available account
  if (store.currentUserId === userId) {
    store.currentUserId = store.accounts.length > 0 ? store.accounts[0].user.id : null;
  }
  
  saveAccounts(store);
}

/**
 * Switch to a different account
 */
export function switchAccount(userId: number): void {
  const store = getAccounts();
  const account = store.accounts.find(acc => acc.user.id === userId);
  
  if (!account) {
    throw new Error('Account not found');
  }
  
  store.currentUserId = userId;
  saveAccounts(store);
}

/**
 * Get the current account
 */
export function getCurrentAccount(): StoredAccount | null {
  const store = getAccounts();
  if (!store.currentUserId) {
    return null;
  }
  
  return store.accounts.find(acc => acc.user.id === store.currentUserId) || null;
}

/**
 * Get the current auth token
 */
export function getCurrentToken(): string | null {
  const account = getCurrentAccount();
  return account ? account.token : null;
}

/**
 * Clear all accounts (logout all)
 */
export function clearAllAccounts(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Logout current account
 */
export async function logoutCurrentAccount(apiUrl: string): Promise<void> {
  const account = getCurrentAccount();
  if (!account) {
    return;
  }
  
  try {
    // Call API to logout
    await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.token}`,
      },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  
  // Remove account from storage
  removeAccount(account.user.id);
}

