import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import * as preferencesService from '../services/preferences.service';

const router = Router();

/**
 * GET /sections/server/:serverId - Get channel sections for a server
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

    const sections = await preferencesService.getChannelSections(userId, serverId);

    res.json({
      success: true,
      data: { sections },
    });
  } catch (error) {
    console.error('Error getting channel sections:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get channel sections',
    });
  }
});

/**
 * PUT /sections/server/:serverId - Update channel sections for a server
 */
router.put('/server/:serverId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const serverId = parseInt(req.params.serverId);
    const { sections } = req.body;

    if (isNaN(serverId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid server ID',
      });
      return;
    }

    if (!Array.isArray(sections)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Sections must be an array',
      });
      return;
    }

    await preferencesService.updateChannelSections(userId, serverId, sections);

    res.json({
      success: true,
      data: { sections },
    });
  } catch (error) {
    console.error('Error updating channel sections:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update channel sections',
    });
  }
});

export default router;

