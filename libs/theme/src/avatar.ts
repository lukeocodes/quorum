/**
 * Avatar color palette
 * Used for user and AI member avatars
 */
export const avatarColors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
] as const;

export type AvatarColor = typeof avatarColors[number];

/**
 * Get a random avatar color
 */
export function getRandomAvatarColor(): AvatarColor {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)];
}

/**
 * Get avatar color based on a seed (e.g., user ID)
 * This ensures the same seed always gets the same color
 */
export function getAvatarColorFromSeed(seed: number | string): AvatarColor {
  let hash = 0;
  const str = seed.toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

/**
 * Get initials from a name
 */
export function getInitials(name: string, maxLength = 2): string {
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    return words[0].substring(0, maxLength).toUpperCase();
  }
  
  return words
    .slice(0, maxLength)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Get text color (black or white) based on background color for contrast
 */
export function getContrastTextColor(backgroundColor: string): '#000000' | '#FFFFFF' {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

