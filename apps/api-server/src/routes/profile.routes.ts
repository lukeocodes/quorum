import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as profileService from '../services/profile.service';

const router = Router();

/**
 * GET /servers/:serverId/profiles/me
 * Get current user's merged profile (user + server profile)
 */
router.get('/servers/:serverId/profiles/me', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const userId = req.user!.id;

    const profile = await profileService.getMergedProfile(serverId, userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    const status = error.message === 'Not a member of this server' ? 403 : 
                   error.message === 'User not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to get profile',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * PUT /servers/:serverId/profiles/me
 * Update current user's server profile (creates on first edit)
 */
router.put('/servers/:serverId/profiles/me', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const userId = req.user!.id;
    const { display_name, full_name, title, pronouns, timezone } = req.body;

    const profile = await profileService.updateServerProfile(serverId, userId, {
      display_name,
      full_name,
      title,
      pronouns,
      timezone,
    });

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    const status = error.message === 'Not a member of this server' ? 403 : 
                   error.message === 'User not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /servers/:serverId/profiles/:userId
 * Get another user's server profile
 */
router.get('/servers/:serverId/profiles/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const viewingUserId = req.user!.id;
    const targetUserId = parseInt(req.params.userId);

    const profile = await profileService.getOtherUserProfile(serverId, viewingUserId, targetUserId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    const status = error.message === 'Not a member of this server' ? 403 : 
                   error.message === 'User not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;

