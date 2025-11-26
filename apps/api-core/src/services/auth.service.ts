import { getPool } from '../config/database';
import { hashPassword, verifyPassword, generateSessionToken } from '../utils/encryption';
import type { User, SignupRequest, SignupResponse, LoginRequest, LoginResponse } from '@quorum/proto';

/**
 * Sign up a new user
 */
export async function signUp(data: SignupRequest): Promise<SignupResponse> {
  const pool = getPool();
  const { username, email, password, display_name } = data;

  // Validate inputs
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  if (!email || !email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  try {
    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate random avatar color
    const colors = [
      '#8b5cf6',
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#ec4899',
      '#14b8a6',
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, avatar_color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, display_name, avatar_color, created_at, updated_at`,
      [username, email, passwordHash, display_name || username, avatarColor]
    );

    const user = result.rows[0] as User;

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    return {
      user,
      token,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Log in an existing user
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const pool = getPool();
  const { username_or_email, password } = data;

  try {
    // Find user by username or email
    const result = await pool.query(
      `SELECT id, username, email, password_hash, display_name, avatar_color, created_at, updated_at
       FROM users
       WHERE username = $1 OR email = $1`,
      [username_or_email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid username/email or password');
    }

    const userRow = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, userRow.password_hash);

    if (!isValid) {
      throw new Error('Invalid username/email or password');
    }

    // Remove password hash from response
    const { password_hash, ...user } = userRow;

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    return {
      user: user as User,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Validate a session token and return the user
 */
export async function validateSession(token: string): Promise<User | null> {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_color, u.created_at, u.updated_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Log out a user by deleting their session
 */
export async function logout(token: string): Promise<boolean> {
  const pool = getPool();

  try {
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const pool = getPool();

  try {
    const result = await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    if (result.rowCount && result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} expired sessions`);
    }
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}

