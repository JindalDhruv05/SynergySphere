import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import Task from '../models/task.model.js';
import TaskMember from '../models/taskMember.model.js';
import Chat from '../models/chat.model.js';
import ChatMember from '../models/chatMember.model.js';
import DriveDocument from '../models/driveDocument.model.js';
import DrivePermission from '../models/drivePermission.model.js';

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Check if user is a member of a project
export const isProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    const isMember = await ProjectMember.exists({
      projectId,
      userId: req.user.id
    });
    
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not a member of this project' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking project membership', error: error.message });
  }
};

// Check if user is a project admin
export const isProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    // Admin users bypass this check
    if (req.user.role === 'admin') {
      return next();
    }
    
    const projectMember = await ProjectMember.findOne({
      projectId,
      userId: req.user.id
    });
    
    if (!projectMember || projectMember.role !== 'admin') {
      return res.status(403).json({ message: 'Project admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking project admin status', error: error.message });
  }
};

// Check if user is a member of a task
export const isTaskMember = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId;
    
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }
    
    // First check if user is directly assigned to the task
    const isDirectMember = await TaskMember.exists({
      taskId,
      userId: req.user.id
    });
    
    if (isDirectMember) {
      return next();
    }
    
    // If not directly assigned, check if user is admin or task creator
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.createdBy.toString() === req.user.id || req.user.role === 'admin') {
      return next();
    }
    
    // Finally, check if user is a member of the project
    const isProjectMember = await ProjectMember.exists({
      projectId: task.projectId,
      userId: req.user.id
    });
    
    if (!isProjectMember) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking task membership', error: error.message });
  }
};

// Check if user is a member of a chat
export const isChatMember = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }
    
    const isMember = await ChatMember.exists({
      chatId,
      userId: req.user.id
    });
    
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking chat membership', error: error.message });
  }
};

// Check if user is a chat admin (creator)
export const isChatAdmin = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }
    
    // Admin users bypass this check
    if (req.user.role === 'admin') {
      return next();
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // For project chats, check if user is project admin
    if (chat.type === 'project') {
      const projectChat = await ProjectChat.findOne({ chatId });
      if (projectChat) {
        const isAdmin = await ProjectMember.exists({
          projectId: projectChat.projectId,
          userId: req.user.id,
          role: 'admin'
        });
        
        if (isAdmin) {
          return next();
        }
      }
    }
    
    return res.status(403).json({ message: 'Chat admin access required' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking chat admin status', error: error.message });
  }
};

// Check if user has access to a document
export const hasDocumentAccess = async (req, res, next) => {
  try {
    const documentId = req.params.id || req.params.documentId;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    const document = await DriveDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Document owner always has access
    if (document.uploadedBy.toString() === req.user.id) {
      return next();
    }
    
    // Admin users bypass this check
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user has explicit permission
    const hasPermission = await DrivePermission.exists({
      documentId,
      userId: req.user.id
    });
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to access this document' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking document access', error: error.message });
  }
};

// Check if user is document owner
export const isDocumentOwner = async (req, res, next) => {
  try {
    const documentId = req.params.id || req.params.documentId;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    const document = await DriveDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Admin users bypass this check
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only document owner can perform this action' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking document ownership', error: error.message });
  }
};
