// socket/socketHandlers.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import ChatMember from '../models/chatMember.model.js';
import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import { createNotification } from '../controllers/notification.controller.js';

let io = null; // Store the io instance
const connectedUsers = new Map(); // Store socket connections

export const initializeSocketHandlers = (socketIo) => {
  io = socketIo; // Store the instance for later use
    // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('❌ Socket connection rejected: No token provided');
        return next(new Error('Authentication error'));
      }
      
      console.log('🔐 Attempting to verify token for socket connection...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('❌ Socket connection rejected: User not found');
        return next(new Error('User not found'));
      }
      
      console.log('✅ Socket authentication successful for user:', user.name);
      socket.user = user;
      next();    } catch (error) {
      console.log('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.user.name} connected: ${socket.id}`);
    
    // Store user connection
    connectedUsers.set(socket.user.id.toString(), socket.id);
    console.log(`👥 Connected users count: ${connectedUsers.size}`);
    console.log(`🔗 User ${socket.user.name} mapped to socket ${socket.id}`);
    
    // Join user to their personal room for direct notifications
    socket.join(`user_${socket.user.id}`);
      // Join user to their chats
    handleJoinUserChats(socket);
    
    // Join user to their projects
    handleJoinUserProjects(socket);
    
    // Handle chat events
    handleChatEvents(socket, io);
    
    // Handle project events
    handleProjectEvents(socket, io);
      // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.user.name} disconnected: ${socket.id}`);
      connectedUsers.delete(socket.user.id.toString());
      console.log(`👥 Connected users count: ${connectedUsers.size}`);
    });
  });
};

// Export function to get the socket instance
export const getSocketInstance = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Export function to get connected users
export const getConnectedUsers = () => {
  return connectedUsers;
};

const handleJoinUserChats = async (socket) => {
  try {
    // Get all chats where user is a member
    const chatMembers = await ChatMember.find({ userId: socket.user.id });
    
    // Join socket to each chat room
    for (const member of chatMembers) {
      socket.join(`chat_${member.chatId}`);
    }
    
    console.log(`User ${socket.user.name} joined ${chatMembers.length} chat rooms`);
  } catch (error) {
    console.error('Error joining user chats:', error);
  }
};

const handleChatEvents = (socket, io) => {
  // Join a specific chat
  socket.on('join_chat', async (chatId) => {
    try {
      // Verify user is member of this chat
      const isMember = await ChatMember.exists({
        chatId,
        userId: socket.user.id
      });
      
      if (isMember) {
        socket.join(`chat_${chatId}`);
        socket.emit('joined_chat', { chatId, success: true });
      } else {
        socket.emit('joined_chat', { chatId, success: false, error: 'Not a member' });
      }
    } catch (error) {
      socket.emit('joined_chat', { chatId, success: false, error: error.message });
    }
  });
  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { chatId, content } = data;
      
      // Verify user is member of this chat
      const isMember = await ChatMember.exists({
        chatId,
        userId: socket.user.id
      });
      
      if (!isMember) {
        socket.emit('message_error', { error: 'Not authorized to send message' });
        return;
      }
      
      // Create and save message
      const message = new Message({
        chatId,
        senderId: socket.user.id,
        content,
        readBy: [socket.user.id] // Sender has read the message
      });
      
      await message.save();
      
      // Populate sender info
      await message.populate('senderId', 'name email avatar');
      
      // Update chat's updatedAt timestamp
      await Chat.findByIdAndUpdate(chatId, { updatedAt: Date.now() });
        // Handle @mentions (ping notifications)
      // Support both @username and @"full name" formats
      const mentionPatterns = [
        /@"([^"]+)"/g,      // @"John Doe" - quoted names with spaces
        /@'([^']+)'/g,      // @'John Doe' - single quoted names
        /@([\w]+)/g         // @username - simple usernames without spaces
      ];
      
      const mentions = new Set();
      
      for (const pattern of mentionPatterns) {
        let match;
        while ((match = pattern.exec(content))) {
          mentions.add(match[1]);
        }
        // Reset regex lastIndex for next pattern
        pattern.lastIndex = 0;
      }        if (mentions.size > 0) {
        // Fetch sender name
        const sender = await User.findById(socket.user.id).select('name');
        console.log(`🎯 Processing @mentions from ${sender.name}:`, Array.from(mentions));
        console.log(`📝 Original message content: "${content}"`);
        
        for (const username of mentions) {
          console.log(`🔍 Looking for user with name: "${username}"`);
          const mentionedUser = await User.findOne({ name: username });
          if (mentionedUser && mentionedUser._id.toString() !== socket.user.id) {
            console.log(`📝 Creating notification for @${username} (${mentionedUser._id})`);
              // Create notification
            const notif = await createNotification(
              mentionedUser._id,
              'chat_ping',
              'Chat Mention',
              `${sender.name} mentioned you in chat`,
              chatId,
              {
                chatId,
                senderName: sender.name,
                senderId: socket.user.id
              }
            );
            
            if (notif) {
              console.log('✅ Notification created:', notif);
              // Emit notification via Socket.IO to the mentioned user
              const userSocketId = connectedUsers.get(mentionedUser._id.toString());
              if (userSocketId) {
                console.log(`🔔 Emitting notification to socket ${userSocketId}`);
                io.to(userSocketId).emit('new_notification', notif);
              } else {
                console.log(`⚠️ User ${mentionedUser.name} not connected via socket`);
              }
            } else {
              console.log('❌ Failed to create notification');
            }
          } else if (mentionedUser && mentionedUser._id.toString() === socket.user.id) {
            console.log(`⏭️ Skipping self-mention for ${username}`);
          } else {
            console.log(`⚠️ User not found for mention: ${username}`);
          }
        }
      }
      
      // Emit message to all users in the chat room
      io.to(`chat_${chatId}`).emit('new_message', {
        _id: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        readBy: message.readBy,
        createdAt: message.createdAt
      });
      
    } catch (error) {
      socket.emit('message_error', { error: error.message });
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { chatId, messageIds } = data;
      
      // Update messages to include user in readBy array
      await Message.updateMany(
        { 
          _id: { $in: messageIds },
          chatId,
          readBy: { $ne: socket.user.id }
        },
        { $addToSet: { readBy: socket.user.id } }
      );
      
      // Notify other users in chat that messages were read
      socket.to(`chat_${chatId}`).emit('messages_read', {
        userId: socket.user.id,
        messageIds
      });
      
    } catch (error) {
      socket.emit('read_error', { error: error.message });
    }
  });

  // User typing indicator
  socket.on('typing_start', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_typing', {
      userId: socket.user.id,
      userName: socket.user.name,
      chatId
    });
  });

  socket.on('typing_stop', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
      userId: socket.user.id,
      chatId
    });
  });
  // Leave chat
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    socket.emit('left_chat', { chatId });
  });
};

const handleJoinUserProjects = async (socket) => {
  try {
    // Get all projects where user is a member or creator
    const projectMembers = await ProjectMember.find({ userId: socket.user.id });
    const createdProjects = await Project.find({ createdBy: socket.user.id }).select('_id');
    
    // Join socket to each project room
    for (const member of projectMembers) {
      socket.join(`project_${member.projectId}`);
    }
    
    for (const project of createdProjects) {
      socket.join(`project_${project._id}`);
    }
    
    const totalProjects = projectMembers.length + createdProjects.length;
    console.log(`User ${socket.user.name} joined ${totalProjects} project rooms`);
  } catch (error) {
    console.error('Error joining user projects:', error);
  }
};

const handleProjectEvents = (socket, io) => {
  // Join a specific project room
  socket.on('join_project', async (projectId) => {
    try {
      // Verify user is member of this project or creator
      const isMember = await ProjectMember.exists({
        projectId,
        userId: socket.user.id
      });
      
      const isCreator = await Project.exists({
        _id: projectId,
        createdBy: socket.user.id
      });
      
      if (isMember || isCreator) {
        socket.join(`project_${projectId}`);
        socket.emit('joined_project', { projectId, success: true });
      } else {
        socket.emit('joined_project', { projectId, success: false, error: 'Not a member' });
      }
    } catch (error) {
      socket.emit('joined_project', { projectId, success: false, error: error.message });
    }
  });

  // Leave project room
  socket.on('leave_project', (projectId) => {
    socket.leave(`project_${projectId}`);
    socket.emit('left_project', { projectId });
  });
};
