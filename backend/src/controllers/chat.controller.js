import Chat from '../models/chat.model.js';
import ChatMember from '../models/chatMember.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import { getSocketInstance, getConnectedUsers } from '../socket/socketHandlers.js';
import ProjectChat from '../models/projectChat.model.js';
import Project from '../models/project.model.js';
import TaskChat from '../models/taskChat.model.js';
import Task from '../models/task.model.js';
import ProjectMember from '../models/projectMember.model.js';
import TaskMember from '../models/taskMember.model.js';
import { createNotification } from './notification.controller.js';

// Get all chats for current user
export const getChats = async (req, res) => {
  try {
    // Auto-create project chats for user's projects
    const userProjects = await ProjectMember.find({ userId: req.user.id }).select('projectId');
    for (const { projectId } of userProjects) {
      let pc = await ProjectChat.findOne({ projectId });
      if (!pc) {
        const project = await Project.findById(projectId).select('name');
        const chatDoc = new Chat({ type: 'project', name: project?.name || 'Project Chat' });
        await chatDoc.save();
        pc = new ProjectChat({ chatId: chatDoc._id, projectId });
        await pc.save();
      }
    }
    // Auto-create task chats for user's tasks
    const userTasks = await TaskMember.find({ userId: req.user.id }).select('taskId');
    for (const { taskId } of userTasks) {
      let tc = await TaskChat.findOne({ taskId });
      if (!tc) {
        const task = await Task.findById(taskId).select('title');
        const chatDoc = new Chat({ type: 'task', name: task?.title || 'Task Chat' });
        await chatDoc.save();
        tc = new TaskChat({ chatId: chatDoc._id, taskId });
        await tc.save();
      }
    }
    // Ensure project/task chat memberships are up to date
    const projectChats = await ProjectChat.find();
    await Promise.all(projectChats.map(pc => pc.syncWithProjectMembers()));
    const taskChats = await TaskChat.find();
    await Promise.all(taskChats.map(tc => tc.syncWithTaskMembers()));
    // Fetch all chats for current user
    const chatMembers = await ChatMember.find({ userId: req.user.id });
    const chatIds = chatMembers.map(cm => cm.chatId);

    // Fetch chat documents
    const chats = await Chat.find({ _id: { $in: chatIds } })
      .sort({ updatedAt: -1 })
      .lean();
    const chatsWithDisplayName = await Promise.all(chats.map(async chat => {
      if (chat.type === 'personal') {
        const members = await ChatMember.find({ chatId: chat._id });
        const otherMember = members.find(m => m.userId.toString() !== req.user.id);
        const otherUser = await User.findById(otherMember.userId).select('name');
        return { ...chat, name: otherUser ? otherUser.name : chat.name };
      } else if (chat.type === 'project') {
        const pc = await ProjectChat.findOne({ chatId: chat._id });
        if (pc) {
          const project = await Project.findById(pc.projectId).select('name');
          return { ...chat, name: project ? project.name : chat.name };
        }
      } else if (chat.type === 'task') {
        const tc = await TaskChat.findOne({ chatId: chat._id });
        if (tc) {
          const task = await Task.findById(tc.taskId).select('title');
          return { ...chat, name: task ? task.title : chat.name };
        }
      }
      return chat;
    }));

    res.status(200).json(chatsWithDisplayName);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
};

// Get chat by ID
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat', error: error.message });
  }
};

// Create new chat
export const createChat = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    let chatName = name;

    // Personal chat: require exactly one other member
    if (type === 'personal') {
      if (!memberIds || memberIds.length !== 1) {
        return res.status(400).json({ message: 'Personal chat requires exactly one other member' });
      }
      const otherUser = await User.findById(memberIds[0]);
      if (!otherUser) {
        return res.status(404).json({ message: 'User not found for personal chat' });
      }
      chatName = `${otherUser.name} (${otherUser.email})`;
    }
    // Group chat: require a name and at least one other member
    if (type === 'group') {
      if (!memberIds || memberIds.length < 1) {
        return res.status(400).json({ message: 'Group chat requires at least one other member' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Group chat requires a name' });
      }
      chatName = name.trim();
    }

    // Create chat document
    const chat = new Chat({
      type,
      name: chatName || (type === 'group' ? '' : 'New Chat')
    });
    await chat.save();

    // Add members: creator and others
    const membersToAdd = [req.user.id];
    if (memberIds && memberIds.length) {
      membersToAdd.push(...memberIds);
    }
    // Remove duplicates
    const uniqueMembers = Array.from(new Set(membersToAdd));

    // Insert ChatMember entries
    const chatMemberDocs = uniqueMembers.map(userId => ({ chatId: chat._id, userId }));
    await ChatMember.insertMany(chatMemberDocs);

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat', error: error.message });
  }
};

// Update chat
export const updateChat = async (req, res) => {
  try {
    const { name } = req.body;
    
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    
    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat', error: error.message });
  }
};

// Delete chat
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Delete chat and all related data
    await Chat.findByIdAndDelete(req.params.id);
    await ChatMember.deleteMany({ chatId: req.params.id });
    await Message.deleteMany({ chatId: req.params.id });
    
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat', error: error.message });
  }
};

// Get chat members
export const getChatMembers = async (req, res) => {
  try {
    const members = await ChatMember.find({ chatId: req.params.id })
      .populate('userId', 'name email avatar');
    
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat members', error: error.message });
  }
};

// Add chat member
export const addChatMember = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    const existingMember = await ChatMember.findOne({
      chatId: req.params.id,
      userId
    });
    
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this chat' });
    }
    
    const chatMember = new ChatMember({
      chatId: req.params.id,
      userId
    });
    
    await chatMember.save();

     // Emit via Socket.IO
    const io = getSocketInstance();
    if (io) {
      // Get user socket and join them to chat room
      const userSocketId = getConnectedUsers().get(userId);
      if (userSocketId) {
        const userSocket = io.sockets.sockets.get(userSocketId);
        if (userSocket) {
          userSocket.join(`chat_${req.params.id}`);
        }
      }
      
      // Notify all chat members
      io.to(`chat_${req.params.id}`).emit('member_joined', {
        chatId: req.params.id,
        userId,
        memberInfo: await User.findById(userId).select('name email avatar')
      });
    }
    
    res.status(201).json(chatMember);
  } catch (error) {
    res.status(500).json({ message: 'Error adding chat member', error: error.message });
  }
};

// Remove chat member
export const removeChatMember = async (req, res) => {
  try {
    const deletedMember = await ChatMember.findOneAndDelete({
      chatId: req.params.id,
      userId: req.params.userId
    });
    
    if (!deletedMember) {
      return res.status(404).json({ message: 'Chat member not found' });
    }
    
    res.status(200).json({ message: 'Chat member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing chat member', error: error.message });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    
    const query = { chatId: req.params.id };
    
    // For pagination
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .populate('senderId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    res.status(200).json(messages.reverse()); // Return in chronological order
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    
    const message = new Message({
      chatId: req.params.id,
      senderId: req.user.id,
      content,
      readBy: [req.user.id]
    });
    
    await message.save();
    await Chat.findByIdAndUpdate(req.params.id, { updatedAt: Date.now() });
    await message.populate('senderId', 'name email avatar');
    
    // Emit via Socket.IO if available
    const io = getSocketInstance();
    if (io) {
      io.to(`chat_${req.params.id}`).emit('new_message', message);
    }

    // Handle @mentions (ping)
    const mentionPattern = /@([\w]+)/g;
    const mentions = new Set();
    let match;
    while ((match = mentionPattern.exec(content))) {
      mentions.add(match[1]);
    }
    if (mentions.size > 0) {
      // Fetch sender name
      const sender = await User.findById(req.user.id).select('name');
      for (const username of mentions) {
        const mentionedUser = await User.findOne({ name: username });
        if (mentionedUser) {
          // Create notification
          const notif = await createNotification(
            mentionedUser._id,
            'chat_ping',
            `${sender.name} mentioned you in chat`,
            req.params.id
          );
          // Emit notification via Socket.IO
          const userSocketId = getConnectedUsers().get(mentionedUser._id.toString());
          if (userSocketId) {
            getSocketInstance().to(userSocketId).emit('new_notification', notif);
          }
        }
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only allow message sender to delete
    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    
    await Message.findByIdAndDelete(req.params.messageId);
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: 'Message IDs array is required' });
    }
    
    await Message.updateMany(
      { _id: { $in: messageIds }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};
