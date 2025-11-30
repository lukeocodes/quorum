/**
 * @quorum/app - Shared Components
 * 
 * Platform-agnostic UI components that can be used across Electron and Web.
 */

// Primitive components (formerly @quorum/ui)
export { Button, Card, Badge } from './primitives';
export type { ButtonProps, CardProps, BadgeProps } from './primitives';

// Simple components
export { default as LoadingScreen } from './LoadingScreen';
export { default as ContextMenu, type ContextMenuItem } from './ContextMenu';

// Layout components
export { default as MainLayout } from './MainLayout';
export { default as AppTopbar } from './AppTopbar';
export { default as AppSidebar } from './AppSidebar';
export { default as ServerSelectionEmpty } from './ServerSelectionEmpty';

// Server components
export { default as ServerTopbar } from './ServerTopbar';
export { default as ServerSidebar } from './ServerSidebar';
export { default as ServerFooter } from './ServerFooter';

// Channel components
export { default as ChannelTopbar } from './ChannelTopbar';
export { default as ChannelChatArea } from './ChannelChatArea';
export { default as ChannelDetails } from './ChannelDetails';
export { default as CollapsibleContextMenu } from './CollapsibleContextMenu';

// Message components
export { default as MessageList } from './MessageList';
export { default as MessageInput } from './MessageInput';

// Modal components
export { default as CreateChannelModal } from './CreateChannelModal';
export { default as CreateSectionModal } from './CreateSectionModal';

