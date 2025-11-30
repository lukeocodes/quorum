import { create } from 'zustand';

type ContextMenuContent = 'channel-details' | 'user-profile' | null;

interface UIState {
  /** Whether the context menu is open */
  contextMenuOpen: boolean;
  /** Content type currently shown in context menu */
  contextMenuContent: ContextMenuContent;
  /** Width of the context menu panel */
  contextMenuWidth: number;
  /** Width of the server sidebar column */
  serverColumnWidth: number;
  /** Whether the server column is hidden (e.g., on small screens) */
  serverColumnHidden: boolean;
}

interface UIStoreConfig {
  /** Load a UI preference */
  loadPreference?: (key: string) => Promise<string | null>;
  /** Save a UI preference */
  savePreference?: (key: string, value: string) => Promise<void>;
}

interface UIStoreActions {
  /** Open the context menu with specified content */
  openContextMenu: (content: NonNullable<ContextMenuContent>) => void;
  /** Close the context menu */
  closeContextMenu: () => void;
  /** Set the context menu width */
  setContextMenuWidth: (width: number) => void;
  /** Set the server column width */
  setServerColumnWidth: (width: number) => void;
  /** Toggle server column visibility */
  setServerColumnHidden: (hidden: boolean) => void;
  /** Load preferences from storage */
  loadPreferences: () => Promise<void>;
  /** Save server column width preference */
  saveServerColumnWidth: () => Promise<void>;
}

export type UIStore = UIState & UIStoreActions;

// Default values
const DEFAULT_CONTEXT_MENU_WIDTH = 400;
const DEFAULT_SERVER_COLUMN_WIDTH = 320;
const SERVER_MIN_WIDTH = 240;
const SERVER_MAX_WIDTH = 600;

/**
 * Create a UI store with optional persistence configuration
 */
export function createUIStore(config: UIStoreConfig = {}) {
  return create<UIStore>((set, get) => ({
    // Initial state
    contextMenuOpen: false,
    contextMenuContent: null,
    contextMenuWidth: DEFAULT_CONTEXT_MENU_WIDTH,
    serverColumnWidth: DEFAULT_SERVER_COLUMN_WIDTH,
    serverColumnHidden: false,

    // Actions
    openContextMenu: (content: NonNullable<ContextMenuContent>) => {
      set({ contextMenuOpen: true, contextMenuContent: content });
    },

    closeContextMenu: () => {
      set({ contextMenuOpen: false });
    },

    setContextMenuWidth: (width: number) => {
      set({ contextMenuWidth: width });
    },

    setServerColumnWidth: (width: number) => {
      // Constrain to valid range
      const constrainedWidth = Math.max(SERVER_MIN_WIDTH, Math.min(width, SERVER_MAX_WIDTH));
      set({ serverColumnWidth: constrainedWidth });
    },

    setServerColumnHidden: (hidden: boolean) => {
      set({ serverColumnHidden: hidden });
    },

    loadPreferences: async () => {
      if (!config.loadPreference) return;
      
      try {
        const savedWidth = await config.loadPreference('server_column_width');
        if (savedWidth) {
          const width = parseInt(savedWidth, 10);
          if (!isNaN(width) && width >= SERVER_MIN_WIDTH && width <= SERVER_MAX_WIDTH) {
            set({ serverColumnWidth: width });
          }
        }
      } catch (error) {
        console.error('Error loading UI preferences:', error);
      }
    },

    saveServerColumnWidth: async () => {
      if (!config.savePreference) return;
      
      try {
        const { serverColumnWidth } = get();
        await config.savePreference('server_column_width', serverColumnWidth.toString());
      } catch (error) {
        console.error('Error saving server column width:', error);
      }
    },
  }));
}

// Export a default singleton instance for simple use cases
export const useUIStore = createUIStore();

