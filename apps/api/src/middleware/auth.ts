import { Request, Response, NextFunction } from 'express';
import { getPool } from '../config/database';
import type { User } from '@quorum/types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Authentication middleware
 * Validates Bearer token from Authorization header or session cookie
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;
    
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    // Fallback to session cookie
    if (!token && req.cookies && req.cookies.session_token) {
      token = req.cookies.session_token;
    }
    
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization',
      });
      return;
    }
    
    const pool = getPool();
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_color, u.created_at, u.updated_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    
    if (result.rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }
    
    req.user = result.rows[0] as User;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if missing
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;
    
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to session cookie
    if (!token && req.cookies && req.cookies.session_token) {
      token = req.cookies.session_token;
    }
    
    if (!token) {
      next();
      return;
    }
    
    const pool = getPool();
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_color, u.created_at, u.updated_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    
    if (result.rows.length > 0) {
      req.user = result.rows[0] as User;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
}

