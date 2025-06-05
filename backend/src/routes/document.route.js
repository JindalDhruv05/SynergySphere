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
  removeDocumentPermission,
  getDocumentUrls
} from '../controllers/document.controller.js';
import { verifyToken, hasDocumentAccess, isDocumentOwner } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, getDocuments);
router.get('/:id', verifyToken, hasDocumentAccess, getDocumentById);
router.get('/:id/urls', verifyToken, hasDocumentAccess, getDocumentUrls);
router.post('/', verifyToken, upload.single('file'), uploadDocument);
router.put('/:id', verifyToken, isDocumentOwner, updateDocument);
router.delete('/:id', verifyToken, isDocumentOwner, deleteDocument);

// Document permissions
router.get('/:id/permissions', verifyToken, isDocumentOwner, getDocumentPermissions);
router.post('/:id/permissions', verifyToken, isDocumentOwner, addDocumentPermission);
router.put('/:id/permissions/:userId', verifyToken, isDocumentOwner, updateDocumentPermission);
router.delete('/:id/permissions/:userId', verifyToken, isDocumentOwner, removeDocumentPermission);

export default router;
