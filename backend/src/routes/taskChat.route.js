import express from "express";
import { 
  getTaskChat, 
  createTaskChat,
  syncTaskChatMembers
} from '../controllers/taskChat.controller.js';
import { verifyToken, isTaskMember } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/task/:taskId', verifyToken, isTaskMember, getTaskChat);
router.post('/task/:taskId', verifyToken, isTaskMember, createTaskChat);
router.post('/task/:taskId/sync-members', verifyToken, isTaskMember, syncTaskChatMembers);

export default router;
