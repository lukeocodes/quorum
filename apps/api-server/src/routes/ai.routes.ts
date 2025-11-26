import { Router, Request, Response } from 'express';
import * as aiService from '../services/ai.service';
import { authenticate } from '../middleware/auth';
import type { CreateAIMemberRequest, UpdateAIMemberRequest } from '@quorum/proto';

const router = Router();

/**
 * GET /channels/:channelId/ai-members
 * Get all AI members in a channel
 */
router.get('/channels/:channelId/ai-members', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const aiMembers = await aiService.getAIMembers(channelId, req.user!.id);
    res.json({ data: { ai_members: aiMembers } });
  } catch (error: any) {
    console.error('Get AI members error:', error);
    res.status(error.message === 'Access denied' ? 403 : 500).json({
      error: 'Failed to get AI members',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /channels/:channelId/ai-members
 * Add an AI member to a channel
 */
router.post('/channels/:channelId/ai-members', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const data: CreateAIMemberRequest = req.body;
    const aiMember = await aiService.createAIMember(channelId, req.user!.id, data);
    res.status(201).json({ data: { ai_member: aiMember } });
  } catch (error: any) {
    console.error('Create AI member error:', error);
    res.status(error.message === 'Access denied' ? 403 : 400).json({
      error: 'Failed to create AI member',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /ai-members/:id
 * Get AI member details
 */
router.get('/ai-members/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const aiMemberId = parseInt(req.params.id);
    const aiMember = await aiService.getAIMember(aiMemberId, req.user!.id);
    res.json({ data: { ai_member: aiMember } });
  } catch (error: any) {
    console.error('Get AI member error:', error);
    res.status(error.message.includes('not found') || error.message === 'Access denied' ? 404 : 500).json({
      error: 'Failed to get AI member',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * PUT /ai-members/:id
 * Update AI member
 */
router.put('/ai-members/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const aiMemberId = parseInt(req.params.id);
    const data: UpdateAIMemberRequest = req.body;
    const aiMember = await aiService.updateAIMember(aiMemberId, req.user!.id, data);
    res.json({ data: { ai_member: aiMember } });
  } catch (error: any) {
    console.error('Update AI member error:', error);
    res.status(error.message === 'Access denied' ? 403 : 400).json({
      error: 'Failed to update AI member',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * DELETE /ai-members/:id
 * Remove AI member
 */
router.delete('/ai-members/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const aiMemberId = parseInt(req.params.id);
    await aiService.deleteAIMember(aiMemberId, req.user!.id);
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Delete AI member error:', error);
    res.status(error.message === 'Access denied' ? 403 : 500).json({
      error: 'Failed to delete AI member',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;

