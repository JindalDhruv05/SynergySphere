import express from "express";
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  getCurrentUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  connectGoogleDrive,
  disconnectGoogleDrive
} from '../controllers/user.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/', createUser); // Register new user
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/', verifyToken, isAdmin, getUsers);
router.get('/me', verifyToken, getCurrentUser);
router.get('/:id', verifyToken, getUserById);
router.put('/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, isAdmin, deleteUser);
router.put('/me/password', verifyToken, updatePassword);
router.post('/me/google-drive/connect', verifyToken, connectGoogleDrive);
router.delete('/me/google-drive/disconnect', verifyToken, disconnectGoogleDrive);

export default router;
