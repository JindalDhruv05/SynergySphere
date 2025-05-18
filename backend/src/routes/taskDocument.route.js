import express from "express";
import { 
  getTaskDocuments, 
  addDocumentToTask, 
  removeDocumentFromTask 
} from '../controllers/taskDocument.controller.js';
import { verifyToken, isTaskMember } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/task/:taskId/documents', verifyToken, isTaskMember, getTaskDocuments);
router.post('/task/:taskId/documents', verifyToken, isTaskMember, addDocumentToTask);
router.delete('/task/:taskId/documents/:documentId', verifyToken, isTaskMember, removeDocumentFromTask);

export default router;
