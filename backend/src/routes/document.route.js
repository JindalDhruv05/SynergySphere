import express from "express";
import { 
  getDocuments, 
  getDocumentById, 
  uploadDocument, 
  updateDocument, 
  deleteDocument,
  getDocumentPermissions,
  addDocumentPermission,
  updateDocumentPermission,
  removeDocumentPermission
} from '../controllers/document.controller.js';
import { verifyToken, hasDocumentAccess, isDocumentOwner } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getDocuments);
router.get('/:id', verifyToken, hasDocumentAccess, getDocumentById);
router.post('/', verifyToken, uploadDocument);
router.put('/:id', verifyToken, isDocumentOwner, updateDocument);
router.delete('/:id', verifyToken, isDocumentOwner, deleteDocument);

// Document permissions
router.get('/:id/permissions', verifyToken, isDocumentOwner, getDocumentPermissions);
router.post('/:id/permissions', verifyToken, isDocumentOwner, addDocumentPermission);
router.put('/:id/permissions/:userId', verifyToken, isDocumentOwner, updateDocumentPermission);
router.delete('/:id/permissions/:userId', verifyToken, isDocumentOwner, removeDocumentPermission);

export default router;
