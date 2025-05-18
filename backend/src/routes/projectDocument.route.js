import express from "express";
import { 
  getProjectDocuments, 
  addDocumentToProject, 
  removeDocumentFromProject 
} from '../controllers/projectDocument.controller.js';
import { verifyToken, isProjectMember, isProjectAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/project/:projectId/documents', verifyToken, isProjectMember, getProjectDocuments);
router.post('/project/:projectId/documents', verifyToken, isProjectMember, addDocumentToProject);
router.delete('/project/:projectId/documents/:documentId', verifyToken, isProjectAdmin, removeDocumentFromProject);

export default router;
