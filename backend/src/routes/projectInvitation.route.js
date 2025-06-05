import express from 'express';
import {
  sendInvitation,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  getUserInvitations,
  getProjectInvitations,
  resendInvitation
} from '../controllers/projectInvitation.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Send invitation to join a project
router.post('/send', sendInvitation);

// Get invitations for the current user (received invitations)
router.get('/user', getUserInvitations);

// Get all invitations for a specific project (sent invitations)
router.get('/project/:projectId', getProjectInvitations);

// Accept an invitation
router.patch('/:invitationId/accept', acceptInvitation);

// Reject an invitation
router.patch('/:invitationId/reject', rejectInvitation);

// Cancel an invitation (only by sender or project admin)
router.patch('/:invitationId/cancel', cancelInvitation);

// Resend an invitation
router.patch('/:invitationId/resend', resendInvitation);

export default router;
