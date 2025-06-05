import express from "express";
import userRoutes from "./user.route.js";
import authRoutes from "./auth.route.js";
import projectRoutes from "./project.route.js";
import projectInvitationRoutes from "./projectInvitation.route.js";
import taskRoutes from "./task.route.js";
import chatRoutes from "./chat.route.js";
import projectChatRoutes from "./projectChat.route.js";
import taskChatRoutes from "./taskChat.route.js";
import documentRoutes from "./document.route.js";
import projectDocumentRoutes from "./projectDocument.route.js";
import taskDocumentRoutes from "./taskDocument.route.js";
import notificationRoutes from "./notification.route.js";
import expenseRoutes from "./expense.route.js";
import analyticsRoutes from "./analytics.route.js";

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Register all routes
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/project-invitations', projectInvitationRoutes);
router.use('/tasks', taskRoutes);
router.use('/chats', chatRoutes);
router.use('/project-chats', projectChatRoutes);
router.use('/task-chats', taskChatRoutes);
router.use('/documents', documentRoutes);
router.use('/project-documents', projectDocumentRoutes);
router.use('/task-documents', taskDocumentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/expenses', expenseRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
