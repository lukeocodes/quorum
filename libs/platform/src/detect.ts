import type { PlatformType, PlatformInfo, PlatformCapabilities } from './types';

/**
 * Detect if running in Electron
 */
export function isElectron(): boolean {
  // Check for Electron-specific globals
  if (typeof window !== 'undefined') {
    // Check for electronAPI (preload script)
    if ('electronAPI' in window) {
      return true;
    }
    // Check for Electron in user agent
    if (navigator.userAgent.toLowerCase().includes('electron')) {
      return true;
    }
    // Check for Electron process
    if ('process' in window && (window as any).process?.type === 'renderer') {
      return true;
    }
  }
  return false;
}

/**
 * Detect if running in a web browser
 */
export function isWeb(): boolean {
  return typeof window !== 'undefined' && !isElectron();
}

/**
 * Detect if running in development mode
 */
export function isDev(): boolean {
  // Check for development mode via import.meta.env (Vite) or window location
  if (typeof window !== 'undefined') {
    // Check Vite's import.meta.env
    if ((import.meta as any)?.env?.DEV === true) {
      return true;
    }
    // Check for localhost
    return window.location?.hostname === 'localhost' || 
           window.location?.hostname === '127.0.0.1';
  }
  return false;
}

/**
 * Detect operating system
 */
export function detectOS(): PlatformInfo['os'] {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();

  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac') || platform.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
  if (userAgent.includes('android')) return 'android';

  return 'unknown';
}

/**
 * Detect platform type
 */
export function detectPlatformType(): PlatformType {
  if (isElectron()) return 'electron';
  if (isWeb()) return 'web';
  return 'unknown';
}

/**
 * Detect platform capabilities
 */
export function detectCapabilities(): PlatformCapabilities {
  const type = detectPlatformType();
  
  if (type === 'electron') {
    return {
      notifications: true,
      fileSystem: true,
      systemTray: true,
      deepLinks: true,
      windowControls: true,
      localDatabase: true,
      secureStorage: true,
      autoUpdates: true,
      clipboard: true,
      mediaCapture: true,
    };
  }
  
  if (type === 'web') {
    return {
      notifications: 'Notification' in window,
      fileSystem: 'showOpenFilePicker' in window,
      systemTray: false,
      deepLinks: true, // via custom URL schemes
      windowControls: false,
      localDatabase: 'indexedDB' in window,
      secureStorage: false,
      autoUpdates: false,
      clipboard: 'clipboard' in navigator,
      mediaCapture: 'mediaDevices' in navigator,
    };
  }
  
  // Unknown platform
  return {
    notifications: false,
    fileSystem: false,
    systemTray: false,
    deepLinks: false,
    windowControls: false,
    localDatabase: false,
    secureStorage: false,
    autoUpdates: false,
    clipboard: false,
    mediaCapture: false,
  };
}

/**
 * Get full platform information
 */
export function getPlatformInfo(): PlatformInfo {
  return {
    type: detectPlatformType(),
    os: detectOS(),
    isDev: isDev(),
    capabilities: detectCapabilities(),
  };
}

