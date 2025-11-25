import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import type { SignupRequest, LoginRequest } from '@quorum/types';

const router = Router();

/**
 * POST /auth/signup
 * Sign up a new user
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const data: SignupRequest = req.body;
    const result = await authService.signUp(data);
    
    // Set session cookie
    res.cookie('session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    
    res.status(201).json({ data: result });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({
      error: 'Signup failed',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /auth/login
 * Log in an existing user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data: LoginRequest = req.body;
    const result = await authService.login(data);
    
    // Set session cookie
    res.cookie('session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    
    res.json({ data: result });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({
      error: 'Login failed',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /auth/logout
 * Log out current user
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7); // Remove 'Bearer '
    if (token) {
      await authService.logout(token);
    }
    
    // Clear session cookie
    res.clearCookie('session_token');
    
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    res.json({ data: { user: req.user } });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /auth/validate
 * Validate a session token
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const user = await authService.validateSession(token);
    if (user) {
      res.json({ data: { user } });
    } else {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or expired',
      });
    }
  } catch (error: any) {
    console.error('Validate token error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /auth/session
 * Get user from session cookie
 */
router.get('/session', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_token;
    if (!token) {
      return res.status(401).json({
        error: 'No session',
        message: 'No session cookie found',
      });
    }
    
    const user = await authService.validateSession(token);
    if (user) {
      res.json({ data: { user, token } });
    } else {
      res.clearCookie('session_token');
      res.status(401).json({
        error: 'Invalid session',
        message: 'Session is invalid or expired',
      });
    }
  } catch (error: any) {
    console.error('Session validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;

