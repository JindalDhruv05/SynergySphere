import express from "express";
import { 
  getUserNotifications, 
  getNotificationById, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '../controllers/notification.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getUserNotifications);
router.get('/:id', verifyToken, getNotificationById);
router.patch('/:id/read', verifyToken, markNotificationAsRead);
router.patch('/read-all', verifyToken, markAllNotificationsAsRead);
router.delete('/:id', verifyToken, deleteNotification);

export default router;
