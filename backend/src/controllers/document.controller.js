import DriveDocument from '../models/driveDocument.model.js';
import DrivePermission from '../models/drivePermission.model.js';
import User from '../models/user.model.js';
import cloudinary from '../services/cloudinary.js';
import streamifier from 'streamifier';
import { generateCloudinaryUrls } from '../utils/cloudinaryUrl.js';

// Get all documents for current user
export const getDocuments = async (req, res) => {
  try {
    // Find all documents uploaded by user
    const ownDocuments = await DriveDocument.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'name email avatar');
    
    // Find all documents shared with user
    const permissions = await DrivePermission.find({ userId: req.user.id });
    const sharedDocumentIds = permissions.map(p => p.documentId);
    
    const sharedDocuments = await DriveDocument.find({
      _id: { $in: sharedDocumentIds },
      uploadedBy: { $ne: req.user.id } // Exclude own documents
    }).populate('uploadedBy', 'name email avatar');
    
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

// Upload document (Cloudinary)
export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }    // Determine resource type based on file type
    const getResourceType = (mimetype) => {
      if (mimetype.startsWith('image/')) {
        return 'image';
      } else if (mimetype.startsWith('video/')) {
        return 'video';
      } else {
        // For documents (PDF, DOC, TXT, etc.)
        return 'raw';
      }
    };    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: getResourceType(file.mimetype),
          folder: 'synergy_documents',
          public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
          upload_preset: 'ml_default', // Use your upload preset
          // For raw files, preserve original filename extension
          ...(getResourceType(file.mimetype) === 'raw' && {
            format: file.originalname.split('.').pop()
          })
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      // Use streamifier to convert buffer to stream
      streamifier.createReadStream(file.buffer).pipe(stream);
    });const result = await uploadPromise;

    // Save document metadata in DB
    const doc = await DriveDocument.create({
      name: req.body.name || file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: getResourceType(file.mimetype),
      size: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    });

    // Populate the uploadedBy field for response
    await doc.populate('uploadedBy', 'name email avatar');

    res.status(201).json(doc);
  } catch (error) {
    console.error('Upload error:', error);
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
    
    // Check if user owns the document or has permission
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this document' });
    }
    
    // Update document name in database
    document.name = name;
    document.lastModifiedAt = Date.now();
    await document.save();
    
    // Populate uploadedBy field for response
    await document.populate('uploadedBy', 'name email avatar');
    
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
    
    // Check if user owns the document or has permission
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }
    
    // Delete from Cloudinary if publicId exists
    if (document.publicId) {
      try {
        await cloudinary.uploader.destroy(document.publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }
    
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

// Get document URLs for view and download
export const getDocumentUrls = async (req, res) => {
  try {
    const document = await DriveDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    const urls = generateCloudinaryUrls(document);
    
    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json({ message: 'Error generating document URLs', error: error.message });
  }
};
