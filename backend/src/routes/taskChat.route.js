import express from "express";
import { 
  getProjectChat, 
  createProjectChat,
  syncProjectChatMembers
} from '../controllers/projectChat.controller.js';
import { verifyToken, isProjectMember, isProjectAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/project/:projectId', verifyToken, isProjectMember, getProjectChat);
router.post('/project/:projectId', verifyToken, isProjectAdmin, createProjectChat);
router.post('/project/:projectId/sync-members', verifyToken, isProjectAdmin, syncProjectChatMembers);

export default router;
