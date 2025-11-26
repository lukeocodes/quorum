/**
 * Platform types supported by Quorum
 */
export type PlatformType = 'electron' | 'web' | 'unknown';

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
  /** Native notifications support */
  notifications: boolean;
  /** File system access */
  fileSystem: boolean;
  /** System tray support */
  systemTray: boolean;
  /** Deep linking / custom protocol support */
  deepLinks: boolean;
  /** Native window controls */
  windowControls: boolean;
  /** Local database (SQLite) */
  localDatabase: boolean;
  /** Secure storage (keychain/credential manager) */
  secureStorage: boolean;
  /** Auto-updates */
  autoUpdates: boolean;
  /** Clipboard access */
  clipboard: boolean;
  /** Audio/Video capture */
  mediaCapture: boolean;
}

/**
 * Platform information
 */
export interface PlatformInfo {
  /** Platform type */
  type: PlatformType;
  /** Operating system */
  os: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
  /** Whether running in development mode */
  isDev: boolean;
  /** App version (if available) */
  version?: string;
  /** Platform capabilities */
  capabilities: PlatformCapabilities;
}

/**
 * Window state for desktop platforms
 */
export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  isFocused: boolean;
}

/**
 * Platform-specific API interface
 */
export interface PlatformAPI {
  /** Get platform information */
  getInfo(): PlatformInfo;
  
  /** Show a native notification */
  showNotification?(title: string, body: string, options?: NotificationOptions): void;
  
  /** Open external URL in default browser */
  openExternal?(url: string): Promise<void>;
  
  /** Copy text to clipboard */
  copyToClipboard?(text: string): Promise<void>;
  
  /** Read text from clipboard */
  readFromClipboard?(): Promise<string>;
  
  /** Get current window state (desktop only) */
  getWindowState?(): WindowState;
  
  /** Minimize window (desktop only) */
  minimizeWindow?(): void;
  
  /** Maximize/restore window (desktop only) */
  maximizeWindow?(): void;
  
  /** Close window (desktop only) */
  closeWindow?(): void;
}

/**
 * Notification options
 */
export interface NotificationOptions {
  icon?: string;
  badge?: string;
  silent?: boolean;
  tag?: string;
  onClick?: () => void;
}

