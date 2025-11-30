import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import * as preferencesService from '../services/preferences.service';

const router = Router();

/**
 * GET /preferences - Get all user preferences
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = await preferencesService.getAllPreferences(userId);

    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get preferences',
    });
  }
});

/**
 * GET /preferences/app - Get app-level preferences
 */
router.get('/app', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = await preferencesService.getAppPreferences(userId);

    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    console.error('Error getting app preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get app preferences',
    });
  }
});

/**
 * PUT /preferences/app/:key - Set app-level preference
 */
router.put('/app/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Value is required',
      });
      return;
    }

    const preference = await preferencesService.setAppPreference(
      userId,
      key,
      typeof value === 'string' ? value : JSON.stringify(value)
    );

    res.json({
      success: true,
      data: { preference },
    });
  } catch (error) {
    console.error('Error setting app preference:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to set preference',
    });
  }
});

/**
 * GET /preferences/server/:serverId - Get server-specific preferences
 */
router.get('/server/:serverId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const serverId = parseInt(req.params.serverId);

    if (isNaN(serverId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid server ID',
      });
      return;
    }

    const preferences = await preferencesService.getServerPreferences(userId, serverId);

    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    console.error('Error getting server preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get server preferences',
    });
  }
});

/**
 * PUT /preferences/server/:serverId/:key - Set server-specific preference
 */
router.put('/server/:serverId/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const serverId = parseInt(req.params.serverId);
    const { key } = req.params;
    const { value } = req.body;

    if (isNaN(serverId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid server ID',
      });
      return;
    }

    if (value === undefined) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Value is required',
      });
      return;
    }

    const preference = await preferencesService.setServerPreference(
      userId,
      serverId,
      key,
      typeof value === 'string' ? value : JSON.stringify(value)
    );

    res.json({
      success: true,
      data: { preference },
    });
  } catch (error) {
    console.error('Error setting server preference:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to set preference',
    });
  }
});

/**
 * DELETE /preferences/:key - Delete a preference
 */
router.delete('/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;
    const serverId = req.query.serverId ? parseInt(req.query.serverId as string) : undefined;

    const deleted = await preferencesService.deletePreference(userId, key, serverId);

    res.json({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('Error deleting preference:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete preference',
    });
  }
});

export default router;

