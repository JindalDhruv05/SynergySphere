import express from "express";
import { 
  login, 
  logout, 
  refreshToken, 
  verifyEmail 
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);

export default router;
