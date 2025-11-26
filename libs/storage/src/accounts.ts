import type { StorageBackend, StoredSession, AccountStore } from './types';

const ACCOUNTS_KEY = 'accounts';

/**
 * Account manager for multi-account support
 * Manages user sessions stored in a storage backend
 */
export class AccountManager {
  private storage: StorageBackend;

  constructor(storage: StorageBackend) {
    this.storage = storage;
  }

  /**
   * Get all stored accounts
   */
  async getAccounts(): Promise<StoredSession[]> {
    const store = await this.storage.get<AccountStore>(ACCOUNTS_KEY);
    return store?.accounts || [];
  }

  /**
   * Get the current account
   */
  async getCurrentAccount(): Promise<StoredSession | null> {
    const store = await this.storage.get<AccountStore>(ACCOUNTS_KEY);
    if (!store?.currentUserId) return null;
    return store.accounts.find((acc) => acc.userId === store.currentUserId) || null;
  }

  /**
   * Get the current user ID
   */
  async getCurrentUserId(): Promise<number | null> {
    const store = await this.storage.get<AccountStore>(ACCOUNTS_KEY);
    return store?.currentUserId || null;
  }

  /**
   * Add or update an account
   */
  async addAccount(session: StoredSession): Promise<void> {
    const store = await this.storage.get<AccountStore>(ACCOUNTS_KEY) || {
      accounts: [],
      currentUserId: null,
    };

    const existingIndex = store.accounts.findIndex((acc) => acc.userId === session.userId);

    if (existingIndex >= 0) {
      // Update existing account but preserve addedAt
      store.accounts[existingIndex] = {
        ...session,
        addedAt: store.accounts[existingIndex].addedAt,
      };
    } else {
      // Add new account
      store.accounts.push({
        ...session,
        addedAt: Date.now(),
      });
    }

    // Set as current account
    store.currentUserId = session.userId;

    await this.storage.set(ACCOUNTS_KEY, store);
  }

  /**
   * Remove an account
   */
  async removeAccount(userId: number): Promise<void> {
    const store = await this.storage.get<AccountStore>(ACCOUNTS_KEY);
    if (!store) return;

    store.accounts = store.accounts.filter((acc) => acc.userId !== userId);

    // If we removed the current account, switch to another or null
    if (store.currentUserId === userId) {
      store.currentUserId = store.accounts.length > 0 ? store.accounts[0].userId : null;
    }

    await this.storage.set(ACCOUNTS_KEY, store);
  }

  /**
   * Switch to a different account
   */
  async switchAccount(userId: number): Promise<StoredSession | null> {
    const store = await this.storage.get<AccountStore>(ACCOUNTS_KEY);
    if (!store) return null;

    const account = store.accounts.find((acc) => acc.userId === userId);
    if (!account) return null;

    store.currentUserId = userId;
    await this.storage.set(ACCOUNTS_KEY, store);

    return account;
  }

  /**
   * Update token for an account
   */
  async updateToken(userId: number, token: string): Promise<void> {
    const store = await this.storage.get<AccountStore>(ACCOUNTS_KEY);
    if (!store) return;

    const account = store.accounts.find((acc) => acc.userId === userId);
    if (account) {
      account.token = token;
      await this.storage.set(ACCOUNTS_KEY, store);
    }
  }

  /**
   * Check if any accounts exist
   */
  async hasAccounts(): Promise<boolean> {
    const accounts = await this.getAccounts();
    return accounts.length > 0;
  }

  /**
   * Clear all accounts
   */
  async clearAll(): Promise<void> {
    await this.storage.remove(ACCOUNTS_KEY);
  }
}

