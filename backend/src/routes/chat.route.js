import express from "express";
import { 
  getChats, 
  getChatById, 
  createChat, 
  updateChat, 
  deleteChat,
  getChatMembers,
  addChatMember,
  removeChatMember,
  getChatMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead
} from '../controllers/chat.controller.js';
import { verifyToken, isChatMember, isChatAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getChats);
router.get('/:id', verifyToken, isChatMember, getChatById);
router.post('/', verifyToken, createChat);
router.put('/:id', verifyToken, isChatAdmin, updateChat);
router.delete('/:id', verifyToken, isChatAdmin, deleteChat);

// Chat members
router.get('/:id/members', verifyToken, isChatMember, getChatMembers);
router.post('/:id/members', verifyToken, isChatAdmin, addChatMember);
router.delete('/:id/members/:userId', verifyToken, isChatAdmin, removeChatMember);

// Messages
router.get('/:id/messages', verifyToken, isChatMember, getChatMessages);
router.post('/:id/messages', verifyToken, isChatMember, sendMessage);
router.delete('/:id/messages/:messageId', verifyToken, isChatMember, deleteMessage);
router.patch('/:id/messages/read', verifyToken, isChatMember, markMessagesAsRead);

export default router;
