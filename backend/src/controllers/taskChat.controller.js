import TaskChat from '../models/taskChat.model.js';
import Chat from '../models/chat.model.js';
import Task from '../models/task.model.js';

// Get task chat
export const getTaskChat = async (req, res) => {
  try {
    let taskChat = await TaskChat.findOne({ taskId: req.params.taskId }).populate('chatId');
    
    // If no chat exists for this task, create one
    if (!taskChat) {
      // Fetch task for naming
      const task = await Task.findById(req.params.taskId).select('title');
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Create chat document
      const chatDoc = new Chat({ type: 'task', name: `${task.title} Chat` });
      await chatDoc.save();
      
      // Create taskChat and sync members
      taskChat = new TaskChat({ chatId: chatDoc._id, taskId: req.params.taskId });
      await taskChat.save();
      await taskChat.syncWithTaskMembers();
      await taskChat.populate('chatId');
    } else {
      // Dynamically set chat name to task title
      if (taskChat.chatId) {
        const task = await Task.findById(req.params.taskId).select('title');
        if (task) {
          taskChat.chatId.name = task.title;
        }
      }
    }
    
    res.status(200).json(taskChat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task chat', error: error.message });
  }
};

// Create task chat
export const createTaskChat = async (req, res) => {
  try {
    // Check if task exists
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task chat already exists
    const existingChat = await TaskChat.findOne({ taskId: req.params.taskId });
    if (existingChat) {
      return res.status(400).json({ message: 'Task chat already exists' });
    }
    
    // Create chat
    const chat = new Chat({
      type: 'task',
      name: `${task.title} Chat`
    });
    
    await chat.save();
    
    // Create task chat
    const taskChat = new TaskChat({
      chatId: chat._id,
      taskId: req.params.taskId
    });
    
    await taskChat.save();
    
    // Sync with task members
    await taskChat.syncWithTaskMembers();
    
    res.status(201).json(taskChat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task chat', error: error.message });
  }
};

// Sync task chat members
export const syncTaskChatMembers = async (req, res) => {
  try {
    const taskChat = await TaskChat.findOne({ taskId: req.params.taskId });
    
    if (!taskChat) {
      return res.status(404).json({ message: 'Task chat not found' });
    }
    
    await taskChat.syncWithTaskMembers();
    
    res.status(200).json({ message: 'Task chat members synced successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing task chat members', error: error.message });
  }
};
