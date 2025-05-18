import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import Task from '../models/Task.js';
import TaskMember from '../models/TaskMember.js';
import Chat from '../models/Chat.js';
import ChatMember from '../models/chatMember.model.js';
import DriveDocument from '../models/DriveDocument.js';
import DrivePermission from '../models/DrivePermission.js';

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
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
  } catch (error) {
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Check if user is a member of the project
export const isProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    // Check if user is admin (admins have access to all projects)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is the creator of the project
    const project = await Project.findById(projectId);
    if (project && project.createdBy.toString() === req.user.id) {
      return next();
    }
    
    // Check if user is a member of the project
    const isMember = await ProjectMember.exists({ 
      projectId: projectId, 
      userId: req.user.id 
    });
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a member of this project' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Check if user is a project admin
export const isProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    // Check if user is admin (admins have access to all projects)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is the creator of the project
    const project = await Project.findById(projectId);
    if (project && project.createdBy.toString() === req.user.id) {
      return next();
    }
    
    // Check if user is a project admin
    const projectMember = await ProjectMember.findOne({ 
      projectId: projectId, 
      userId: req.user.id 
    });
    
    if (!projectMember || projectMember.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Project admin rights required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Check if user is a member of the task
export const isTaskMember = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId || req.body.taskId;
    
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }
    
    // Check if user is admin (admins have access to all tasks)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Get the task to find its project
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is the creator of the task
    if (task.createdBy.toString() === req.user.id) {
      return next();
    }
    
    // Check if user is a member of the task
    const isTaskMember = await TaskMember.exists({ 
      taskId: taskId, 
      userId: req.user.id 
    });
    
    if (isTaskMember) {
      return next();
    }
    
    // Check if user is a project admin
    const isProjectAdmin = await ProjectMember.exists({
      projectId: task.projectId,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isProjectAdmin) {
      return res.status(403).json({ message: 'Access denied. Not assigned to this task' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Check if user is a member of the chat
export const isChatMember = async (req, res, next) => {
  try {
    const chatId = req.params.id || req.params.chatId || req.body.chatId;
    
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }
    
    // Check if user is admin (admins have access to all chats)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is a member of the chat
    const isMember = await ChatMember.exists({ 
      chatId: chatId, 
      userId: req.user.id 
    });
    
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a member of this chat' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Check if user is a chat admin (creator or designated admin)
export const isChatAdmin = async (req, res, next) => {
  try {
    const chatId = req.params.id || req.params.chatId || req.body.chatId;
    
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }
    
    // Check if user is admin (admins have access to all chats)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Get the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // For project chats, check if user is project admin
    if (chat.type === 'project') {
      const projectChat = await mongoose.model('ProjectChat').findOne({ chatId });
      if (projectChat) {
        const isProjectAdmin = await ProjectMember.exists({
          projectId: projectChat.projectId,
          userId: req.user.id,
          role: 'admin'
        });
        
        if (isProjectAdmin) {
          return next();
        }
      }
    }
    
    // For task chats, check if user is task creator or project admin
    if (chat.type === 'task') {
      const taskChat = await mongoose.model('TaskChat').findOne({ chatId });
      if (taskChat) {
        const task = await Task.findById(taskChat.taskId);
        if (task && task.createdBy.toString() === req.user.id) {
          return next();
        }
        
        const isProjectAdmin = await ProjectMember.exists({
          projectId: task.projectId,
          userId: req.user.id,
          role: 'admin'
        });
        
        if (isProjectAdmin) {
          return next();
        }
      }
    }
    
    // For personal chats, check if user is the creator
    if (chat.type === 'personal' || chat.type === 'group') {
      // The first member added to a chat is considered the creator
      const firstMember = await ChatMember.findOne({ chatId }).sort({ joinedAt: 1 });
      if (firstMember && firstMember.userId.toString() === req.user.id) {
        return next();
      }
    }
    
    return res.status(403).json({ message: 'Access denied. Admin rights required for this chat' });
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Check if user has access to a document
export const hasDocumentAccess = async (req, res, next) => {
  try {
    const documentId = req.params.id || req.params.documentId || req.body.documentId;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    // Check if user is admin (admins have access to all documents)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is the uploader of the document
    const document = await DriveDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (document.uploadedBy.toString() === req.user.id) {
      return next();
    }
    
    // Check if user has permission for the document
    const hasPermission = await DrivePermission.exists({ 
      documentId: documentId, 
      userId: req.user.id 
    });
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied. No permission for this document' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Check if user is the owner of a document
export const isDocumentOwner = async (req, res, next) => {
  try {
    const documentId = req.params.id || req.params.documentId || req.body.documentId;
    
    if (!documentId) {
      return res.status(400).json({ message: 'Document ID is required' });
    }
    
    // Check if user is admin (admins have full access)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is the uploader of the document
    const document = await DriveDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only document owner can perform this action' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// Rate limiting middleware
export const rateLimiter = (maxRequests, timeWindow) => {
  const requestCounts = {};
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Initialize or clean up old entries
    requestCounts[ip] = requestCounts[ip] || [];
    requestCounts[ip] = requestCounts[ip].filter(time => time > now - timeWindow);
    
    // Check if limit is exceeded
    if (requestCounts[ip].length >= maxRequests) {
      return res.status(429).json({ 
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((requestCounts[ip][0] + timeWindow - now) / 1000)
      });
    }
    
    // Add current request timestamp
    requestCounts[ip].push(now);
    next();
  };
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation Error', errors: err.errors });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key error', error: err.message });
  }
  
  // Default error response
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};
