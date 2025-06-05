import Task from '../models/task.model.js';
import TaskMember from '../models/taskMember.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';
import TaskChat from '../models/taskChat.model.js';
import { createGoogleDriveFolder } from '../services/googleDrive.js';
import { createNotification } from './notification.controller.js';
import { getSocketInstance, getConnectedUsers } from '../socket/socketHandlers.js';

// Get all tasks for current user
export const getTasks = async (req, res) => {
  try {
    const { projectId, status } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by project if provided
    if (projectId) {
      query.projectId = projectId;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Find all tasks where user is a member
    const taskMembers = await TaskMember.find({ userId: req.user.id });
    const taskIds = taskMembers.map(tm => tm.taskId);
    
    // Also include tasks created by the user
    query.$or = [
      { _id: { $in: taskIds } },
      { createdBy: req.user.id }
    ];
      const tasks = await Task.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

// Create new task
export const createTask = async (req, res) => {
  try {
    const { projectId, title, description, status, dueDate, priority } = req.body;
    
    // Create Google Drive folder
    let googleDriveFolderId = null;
    if (req.user.googleDriveAccessToken) {
      const folder = await createGoogleDriveFolder(
        title,
        req.user.googleDriveAccessToken,
        req.user.googleDriveRefreshToken
      );
      googleDriveFolderId = folder.id;
    }
    
    const task = new Task({
      projectId,
      title,
      description,
      status: status || 'To-Do',
      dueDate,
      priority: priority || 'Medium',
      createdBy: req.user.id,
      googleDriveFolderId
    });
    
    await task.save();
    
    // Add creator as task member
    const taskMember = new TaskMember({
      taskId: task._id,
      userId: req.user.id,
      role: 'responsible',
      assignedBy: req.user.id
    });
    
    await taskMember.save();
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { title, description, status, dueDate, priority, confirmDone } = req.body;
    
    const currentTask = await Task.findById(req.params.id);
    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If trying to change to Done status without confirmation, return error
    if (status === 'Done' && !confirmDone && currentTask.status !== 'Done') {
      return res.status(400).json({ 
        message: 'Confirmation required to mark task as Done',
        requiresConfirmation: true 
      });
    }

    // If trying to change from Done status after it was confirmed, prevent it
    if (currentTask.status === 'Done' && currentTask.statusConfirmed && status !== 'Done') {
      return res.status(400).json({ 
        message: 'Cannot change status from Done once it has been confirmed',
        statusLocked: true 
      });
    }

    const updateData = { title, description, status, dueDate, priority };
    
    // If confirming Done status, set statusConfirmed to true
    if (status === 'Done' && confirmDone) {
      updateData.statusConfirmed = true;
    }
    
    // If changing from Done to another status (before confirmation), reset statusConfirmed
    if (currentTask.status === 'Done' && status !== 'Done' && !currentTask.statusConfirmed) {
      updateData.statusConfirmed = false;
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Delete task and all related data
    await Task.findByIdAndDelete(req.params.id);
    await TaskMember.deleteMany({ taskId: req.params.id });
    await Comment.deleteMany({ taskId: req.params.id });
    
    // Delete Google Drive folder if exists
    // Implementation depends on your Google Drive service
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// Get subtasks
export const getSubtasks = async (req, res) => {
  try {
    const subtasks = await Task.find({ parentTaskId: req.params.id })
      .populate('createdBy', 'name email avatar');
    
    res.status(200).json(subtasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subtasks', error: error.message });
  }
};

// Create subtask
export const createSubtask = async (req, res) => {
  try {
    const parentTask = await Task.findById(req.params.id);
    if (!parentTask) {
      return res.status(404).json({ message: 'Parent task not found' });
    }
    
    const { title, description, status, dueDate, priority } = req.body;
    
    // Create Google Drive folder
    let googleDriveFolderId = null;
    if (req.user.googleDriveAccessToken) {
      const folder = await createGoogleDriveFolder(
        title,
        req.user.googleDriveAccessToken,
        req.user.googleDriveRefreshToken
      );
      googleDriveFolderId = folder.id;
    }
    
    const subtask = new Task({
      projectId: parentTask.projectId,
      title,
      description,
      status: status || 'To-Do',
      dueDate,
      priority: priority || 'Medium',
      createdBy: req.user.id,
      parentTaskId: req.params.id,
      googleDriveFolderId
    });
    
    await subtask.save();
    
    // Add creator as task member
    const taskMember = new TaskMember({
      taskId: subtask._id,
      userId: req.user.id,
      role: 'responsible',
      assignedBy: req.user.id
    });
    
    await taskMember.save();
    
    res.status(201).json(subtask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subtask', error: error.message });
  }
};

// Get task members
export const getTaskMembers = async (req, res) => {
  try {
    const members = await TaskMember.find({ taskId: req.params.id })
      .populate('userId', 'name email avatar')
      .populate('assignedBy', 'name email avatar');
    
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task members', error: error.message });
  }
};

// Add task member
export const addTaskMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    const existingMember = await TaskMember.findOne({
      taskId: req.params.id,
      userId
    });
    
    if (existingMember) {
      return res.status(400).json({ message: 'User is already assigned to this task' });
    }
    
    const taskMember = new TaskMember({
      taskId: req.params.id,
      userId,
      role: role || 'responsible',
      assignedBy: req.user.id
    });
      await taskMember.save();

    // Sync task chat members if chat exists
    const taskChat = await TaskChat.findOne({ taskId: req.params.id });
    if (taskChat) {
      await taskChat.syncWithTaskMembers();
    }    // Create notification for the assigned user (only if it's not self-assignment)
    console.log(`DEBUG: Adding member - userId: ${userId}, req.user.id: ${req.user.id}`);
    if (userId !== req.user.id) {
      console.log('DEBUG: Creating notification for task assignment');
      const task = await Task.findById(req.params.id);
      const assigner = await User.findById(req.user.id).select('name');
      
      console.log(`DEBUG: Task: ${task?.title}, Assigner: ${assigner?.name}`);
      
      const notif = await createNotification(
        userId,
        'task_assigned',
        `${assigner.name} assigned you to task: ${task.title}`,
        req.params.id
      );

      console.log('DEBUG: Notification created:', !!notif);
      if (notif) {
        console.log('DEBUG: Notification details:', JSON.stringify(notif, null, 2));
        
        // Emit notification via Socket.IO if user is connected
        const io = getSocketInstance();
        const connectedUsers = getConnectedUsers();
        const userSocketId = connectedUsers.get(userId);
        
        console.log(`DEBUG: Socket IO: ${!!io}, Connected users count: ${connectedUsers.size}, User socket ID: ${userSocketId}`);
        
        if (io && userSocketId) {
          io.to(userSocketId).emit('new_notification', notif);
          console.log('DEBUG: Notification emitted via socket');
        } else {
          console.log('DEBUG: User not connected via socket or no socket instance');
        }
      } else {
        console.log('DEBUG: Failed to create notification');
      }
    } else {
      console.log('DEBUG: Skipping notification - self assignment');
    }

    res.status(201).json(taskMember);
  } catch (error) {
    res.status(500).json({ message: 'Error adding task member', error: error.message });
  }
};

// Update task member
export const updateTaskMember = async (req, res) => {
  try {
    const { role } = req.body;
    
    const updatedMember = await TaskMember.findOneAndUpdate(
      { taskId: req.params.id, userId: req.params.userId },
      { role },
      { new: true }
    );
    
    if (!updatedMember) {
      return res.status(404).json({ message: 'Task member not found' });
    }
    
    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task member', error: error.message });
  }
};

// Remove task member
export const removeTaskMember = async (req, res) => {
  try {
    const deletedMember = await TaskMember.findOneAndDelete({
      taskId: req.params.id,
      userId: req.params.userId
    });
    
    if (!deletedMember) {
      return res.status(404).json({ message: 'Task member not found' });
    }
    
    res.status(200).json({ message: 'Task member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing task member', error: error.message });
  }
};

// Get task comments
export const getTaskComments = async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task comments', error: error.message });
  }
};

// Add task comment
export const addTaskComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    const comment = new Comment({
      taskId: req.params.id,
      content,
      author: req.user.id
    });
    
    await comment.save();
    
    // Populate author info for response
    await comment.populate('author', 'name email avatar');
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Delete task comment
export const deleteTaskComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Only allow comment author or admin to delete
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    await Comment.findByIdAndDelete(req.params.commentId);
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Update task budget
export const updateTaskBudget = async (req, res) => {
  try {
    const { totalBudget, currency, budgetAlerts } = req.body;
    
    const task = await Task.findById(req.params.id).populate('projectId');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Permission check is already handled by isTaskMember middleware
    // Check if new budget would exceed project budget
    if (totalBudget !== undefined && task.projectId) {
      const project = task.projectId;
      
      if (project.budget && project.budget.totalBudget) {
        // Get all tasks in this project
        const allProjectTasks = await Task.find({ projectId: project._id });
        
        // Calculate total budget allocated to all tasks excluding this task
        let totalAllocatedBudget = 0;
        for (const projectTask of allProjectTasks) {
          if (projectTask._id.toString() !== task._id.toString() && projectTask.budget) {
            totalAllocatedBudget += projectTask.budget.totalBudget || 0;
          }
        }
        
        // Add the new budget for this task
        const newTotalAllocated = totalAllocatedBudget + totalBudget;
        
        // Check if total allocated budget would exceed project budget
        if (newTotalAllocated > project.budget.totalBudget) {
          return res.status(400).json({ 
            message: 'Total task budgets cannot exceed project budget',
            projectBudget: project.budget.totalBudget,
            currentAllocated: totalAllocatedBudget,
            requestedTaskBudget: totalBudget,
            wouldResultIn: newTotalAllocated
          });
        }
        
        // Calculate current total task expenses for this task
        const currentExpenseTotal = await task.getTotalExpenses();
        
        // Additional check: if current expenses would exceed new budget
        if (currentExpenseTotal > totalBudget) {
          return res.status(400).json({ 
            message: 'Cannot set budget lower than current expense total',
            currentExpenses: currentExpenseTotal,
            requestedBudget: totalBudget
          });
        }
      }
    }
    
    // Initialize budget object if it doesn't exist
    if (!task.budget) {
      task.budget = {
        totalBudget: 0,
        currency: 'USD',
        budgetAlerts: {
          enabled: true,
          thresholds: [
            { percentage: 80, notified: false }
          ]
        }
      };
    }
    
    // Update budget fields
    if (totalBudget !== undefined) task.budget.totalBudget = totalBudget;
    if (currency) task.budget.currency = currency;
    if (budgetAlerts) {
      task.budget.budgetAlerts = {
        ...task.budget.budgetAlerts,
        ...budgetAlerts
      };
    }
    
    await task.save();
    
    // Check budget thresholds and create notifications if needed
    await checkTaskBudgetThresholds(task);
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task budget', error: error.message });
  }
};

// Get task budget overview
export const getTaskBudgetOverview = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Initialize budget object if it doesn't exist
    if (!task.budget) {
      task.budget = {
        totalBudget: 0,
        currency: 'USD',
        budgetAlerts: {
          enabled: true,
          thresholds: [
            { percentage: 80, notified: false }
          ]
        }
      };
    }
    
    // Get expense summary for this task
    const Expense = await import('../models/expense.model.js');
    const expenses = await Expense.default.find({ taskId });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const approvedExpenses = expenses
      .filter(exp => exp.status === 'Approved' || exp.status === 'Paid')
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate budget utilization
    const budgetUtilization = task.budget.totalBudget > 0 
      ? (approvedExpenses / task.budget.totalBudget) * 100 
      : 0;
    
    // Expense breakdown by category
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { count: 0, amount: 0 };
      }
      acc[expense.category].count++;
      acc[expense.category].amount += expense.amount;
      return acc;
    }, {});
    
    res.status(200).json({
      budget: task.budget,
      totalExpenses,
      approvedExpenses,
      pendingExpenses: totalExpenses - approvedExpenses,
      remainingBudget: Math.max(0, task.budget.totalBudget - approvedExpenses),
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      categoryBreakdown,
      expenseCount: expenses.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task budget overview', error: error.message });
  }
};

// Helper function to check task budget thresholds and create notifications
const checkTaskBudgetThresholds = async (task) => {
  try {
    if (!task.budget.budgetAlerts?.enabled || !task.budget.totalBudget) {
      return;
    }

    const totalExpenses = await task.getTotalExpenses();
    const utilization = await task.getBudgetUtilization();
    const thresholds = task.budget.budgetAlerts.thresholds || [];

    // Get task members who should receive notifications
    const taskMembers = await TaskMember.find({
      taskId: task._id
    }).populate('userId', '_id');

    const recipientIds = [...new Set([
      task.createdBy.toString(),
      ...taskMembers.map(tm => tm.userId._id.toString())
    ])];

    // Check each threshold
    for (const threshold of thresholds) {
      if (utilization >= threshold.percentage) {
        // Check if notification already exists for this threshold
        const Notification = await import('../models/notification.model.js');
        const existingNotification = await Notification.default.findOne({
          recipientId: { $in: recipientIds },
          type: 'budget_threshold',
          'metadata.taskId': task._id,
          'metadata.threshold': threshold.percentage,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        });

        if (!existingNotification) {
          // Create notifications for all recipients
          const notifications = recipientIds.map(recipientId => ({
            recipientId,
            type: 'budget_threshold',
            title: `Task Budget Alert: ${task.title}`,
            message: `Task "${task.title}" has reached ${utilization.toFixed(1)}% of its budget (${task.budget.currency} ${totalExpenses.toLocaleString()} / ${task.budget.currency} ${task.budget.totalBudget.toLocaleString()})`,
            metadata: {
              taskId: task._id,
              projectId: task.projectId,
              threshold: threshold.percentage,
              utilization,
              totalExpenses,
              totalBudget: task.budget.totalBudget
            }
          }));

          await Notification.default.insertMany(notifications);
        }
      }
    }
  } catch (error) {
    console.error('Error checking task budget thresholds:', error);
  }
};
