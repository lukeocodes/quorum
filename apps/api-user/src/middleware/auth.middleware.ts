import { Request, Response, NextFunction } from 'express';
import { getPool } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    display_name: string | null;
    avatar_color: string;
  };
}

/**
 * Middleware to verify session token and attach user to request
 * Validates against the sessions table in the database (same as api-core and api-server)
 */
export async function authenticateToken(
  req: AuthRequest,
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
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
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
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      return;
    }

    req.user = result.rows[0];

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
}

