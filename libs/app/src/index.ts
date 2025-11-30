/**
 * @quorum/app
 * 
 * Shared application core for Quorum apps.
 * 
 * This library provides:
 * - Platform adapter interface for abstracting platform-specific operations
 * - Store context for wiring up modular stores from @quorum/app-state
 * - Shared UI components that work across platforms
 * 
 * The app shells (app-electron, app-web) are responsible for:
 * - Creating platform-specific adapter implementations
 * - Configuring and providing the stores
 * - Rendering the shell-specific UI (window chrome, navigation, etc.)
 */

// Platform adapter
export {
    type PlatformAdapter,
    type PlatformAdapterContextValue,
    PlatformAdapterProvider,
    usePlatformAdapter,
    useAdapterReady,
    usePlatformAdapterSafe,
} from './adapters';

// Store context and hooks (re-exports from @quorum/app-state with added context)
export {
    // Types from app-state
    type User,
    type Server,
    type Channel,
    type Message,
    type ApiConfig,
    type UserSession,

    // Store types
    type ChannelStore,
    type MessageStore,
    type SessionStore,
    type UIStore,
    type AppStores,

    // Store factories
    createChannelStore,
    createMessageStore,
    createSessionStore,
    createUIStore,

    // Context and hooks
    StoreProvider,
    useStores,
    useSessionStore,
    useChannelStore,
    useMessageStore,
    useAppUIStore,
} from './store';

// Shared components
export { 
    // Primitives (formerly @quorum/ui)
    Button,
    Card,
    Badge,
    type ButtonProps,
    type CardProps,
    type BadgeProps,
    // App components
    LoadingScreen, 
    ContextMenu, 
    type ContextMenuItem,
    MainLayout,
    AppTopbar,
    AppSidebar,
    ServerSelectionEmpty,
} from './components';

// Types specific to this package
export type {
    ApiResult,
    ChannelSection,
    PlatformEventCallbacks,
} from './types';

