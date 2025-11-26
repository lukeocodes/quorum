/**
 * @quorum/theme
 * 
 * Shared theming utilities and tokens for Quorum apps
 */

// Design tokens
export {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
  zIndex,
  transition,
} from './tokens';

// Avatar utilities
export {
  avatarColors,
  getRandomAvatarColor,
  getAvatarColorFromSeed,
  getInitials,
  getContrastTextColor,
} from './avatar';
export type { AvatarColor } from './avatar';
