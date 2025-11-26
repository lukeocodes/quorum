/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate username format
 * - 3-30 characters
 * - alphanumeric, underscores, hyphens
 * - must start with letter
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 * Returns an object with strength info
 */
export function validatePassword(password: string): {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  } else {
    score++;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special characters');
  } else {
    score++;
  }

  return {
    isValid: feedback.length === 0 && password.length >= 8,
    score: Math.min(score, 4),
    feedback,
  };
}

/**
 * Check if a string is empty or only whitespace
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Check if a value is a valid number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

