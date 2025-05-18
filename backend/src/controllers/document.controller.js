import DriveDocument from '../models/driveDocument.model.js';
import DrivePermission from '../models/drivePermission.model.js';
import { uploadFileToDrive, updateFileInDrive, deleteFileFromDrive } from '../services/googleDrive.js';

// Get all documents for current user
export const getDocuments = async (req, res) => {
  try {
    // Find all documents uploaded by user
    const ownDocuments = await DriveDocument.find({ uploadedBy: req.user.id });
    
    // Find all documents shared with user
    const permissions = await DrivePermission.find({ userId: req.user.id });
    const sharedDocumentIds = permissions.map(p => p.documentId);
    
    const sharedDocuments = await DriveDocument.find({
      _id: { $in: sharedDocumentIds },
      uploadedBy: { $ne: req.user.id } // Exclude own documents
    });
    
    const documents = [...ownDocuments, ...sharedDocuments];
    
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Get document by ID
export const getDocumentById = async (req, res) => {
  try {
    const document = await DriveDocument.findById(req.params.id)
      .populate('uploadedBy', 'name email avatar');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document', error: error.message });
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    const { name, mimeType, size, folderId } = req.body;
    const file = req.file; // Assuming you're using multer or similar
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Upload to Google Drive
    const driveFile = await uploadFileToDrive(
      file,
      name,
      mimeType,
      folderId,
      req.user.googleDriveAccessToken,
      req.user.googleDriveRefreshToken
    );
    
    const document = new DriveDocument({
      name: driveFile.name,
      mimeType: driveFile.mimeType,
      size: driveFile.size,
      googleDriveFileId: driveFile.id,
      googleDriveWebViewLink: driveFile.webViewLink,
      googleDriveWebContentLink: driveFile.webContentLink,
      uploadedBy: req.user.id
    });
    
    await document.save();
    
    // Add owner permission
    const permission = new DrivePermission({
      documentId: document._id,
      userId: req.user.id,
      role: 'owner',
      type: 'user'
    });
    
    await permission.save();
    
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
};

// Update document
export const updateDocument = async (req, res) => {
  try {
    const { name } = req.body;
    
    const document = await DriveDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Update in Google Drive
    await updateFileInDrive(
      document.googleDriveFileId,
      { name },
      req.user.googleDriveAccessToken,
      req.user.googleDriveRefreshToken
    );
    
    document.name = name;
    document.lastModifiedAt = Date.now();
    await document.save();
    
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error updating document', error: error.message });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const document = await DriveDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Delete from Google Drive
    await deleteFileFromDrive(
      document.googleDriveFileId,
      req.user.googleDriveAccessToken,
      req.user.googleDriveRefreshToken
    );
    
    // Delete document and permissions
    await DriveDocument.findByIdAndDelete(req.params.id);
    await DrivePermission.deleteMany({ documentId: req.params.id });
    
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};

// Get document permissions
export const getDocumentPermissions = async (req, res) => {
  try {
    const permissions = await DrivePermission.find({ documentId: req.params.id })
      .populate('userId', 'name email avatar');
    
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document permissions', error: error.message });
  }
};

// Add document permission
export const addDocumentPermission = async (req, res) => {
  try {
    const { userId, role, type } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if permission already exists
    const existingPermission = await DrivePermission.findOne({
      documentId: req.params.id,
      userId
    });
    
    if (existingPermission) {
      return res.status(400).json({ message: 'Permission already exists for this user' });
    }
    
    const permission = new DrivePermission({
      documentId: req.params.id,
      userId,
      role,
      type: type || 'user'
    });
    
    await permission.save();
    
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ message: 'Error adding document permission', error: error.message });
  }
};

// Update document permission
export const updateDocumentPermission = async (req, res) => {
  try {
    const { role, type } = req.body;
    
    const updatedPermission = await DrivePermission.findOneAndUpdate(
      { documentId: req.params.id, userId: req.params.userId },
      { role, type },
      { new: true }
    );
    
    if (!updatedPermission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    res.status(200).json(updatedPermission);
  } catch (error) {
    res.status(500).json({ message: 'Error updating document permission', error: error.message });
  }
};

// Remove document permission
export const removeDocumentPermission = async (req, res) => {
  try {
    const deletedPermission = await DrivePermission.findOneAndDelete({
      documentId: req.params.id,
      userId: req.params.userId
    });
    
    if (!deletedPermission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    res.status(200).json({ message: 'Permission removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing document permission', error: error.message });
  }
};
