import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import User from '../models/user.model.js'; 
import Notification from '../models/notification.model.js';
import { createGoogleDriveFolder } from '../services/googleDrive.js';
import ProjectChat from '../models/projectChat.model.js';
import { createNotification } from './notification.controller.js';
import { getSocketInstance, getConnectedUsers } from '../socket/socketHandlers.js';

// Get all projects for current user
export const getProjects = async (req, res) => {
  try {
    // Find all projects where user is a member
    const projectMembers = await ProjectMember.find({ userId: req.user.id });
    const projectIds = projectMembers.map(pm => pm.projectId);
    
    // Also include projects created by the user
    const projects = await Project.find({
      $or: [
        { _id: { $in: projectIds } },
        { createdBy: req.user.id }
      ]
    }).populate('createdBy', 'name email avatar');
    
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Create Google Drive folder
    let googleDriveFolderId = null;
    if (req.user.googleDriveAccessToken) {
      const folder = await createGoogleDriveFolder(
        name,
        req.user.googleDriveAccessToken,
        req.user.googleDriveRefreshToken
      );
      googleDriveFolderId = folder.id;
    }
    
    const project = new Project({
      name,
      description,
      createdBy: req.user.id,
      googleDriveFolderId
    });
    
    await project.save();
    
    // Add creator as project admin
    const projectMember = new ProjectMember({
      projectId: project._id,
      userId: req.user.id,
      role: 'admin'
    });
    
    await projectMember.save();
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    
    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Delete project and all related data
    // In a real application, you might want to use transactions
    await Project.findByIdAndDelete(req.params.id);
    await ProjectMember.deleteMany({ projectId: req.params.id });
    
    // Delete Google Drive folder if exists
    // Implementation depends on your Google Drive service
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

// Get project members
export const getProjectMembers = async (req, res) => {
  try {
    const members = await ProjectMember.find({ projectId: req.params.id })
      .populate('userId', 'name email avatar');
    
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project members', error: error.message });
  }
};

// Add project member
export const addProjectMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      projectId: req.params.id,
      userId
    });
    
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }
    
    const projectMember = new ProjectMember({
      projectId: req.params.id,
      userId,
      role: role || 'member'
    });
      await projectMember.save();

    // Sync project chat members if chat exists
    const projectChat = await ProjectChat.findOne({ projectId: req.params.id });
    if (projectChat) {
      await projectChat.syncWithProjectMembers();
    }    // Create notification for the added user (only if it's not self-assignment)
    if (userId !== req.user.id) {
      console.log(`🔔 Creating project member notification for user ${userId}`);
      const project = await Project.findById(req.params.id);
      const adder = await User.findById(req.user.id).select('name');
      
      console.log(`📋 Project: ${project.name}, Adder: ${adder.name}`);
        const notif = await createNotification(
        userId,
        'project_member_added',
        'Added to Project',
        `${adder.name} added you to project: ${project.name}`,
        req.params.id,
        {
          projectId: req.params.id,
          adderName: adder.name,
          projectName: project.name
        }
      );

      if (notif) {
        console.log('✅ Project member notification created:', notif);
        // Emit notification via Socket.IO if user is connected
        const io = getSocketInstance();
        const userSocketId = getConnectedUsers().get(userId);
        if (io && userSocketId) {
          console.log(`🔔 Emitting project notification to socket ${userSocketId}`);
          io.to(userSocketId).emit('new_notification', notif);
        } else {
          console.log(`⚠️ User ${userId} not connected via socket for project notification`);
        }
      } else {
        console.log('❌ Failed to create project member notification');
      }
    } else {
      console.log('⏭️ Skipping notification - user added themselves to project');
    }

    res.status(201).json(projectMember);
  } catch (error) {
    res.status(500).json({ message: 'Error adding project member', error: error.message });
  }
};

// Update project member
export const updateProjectMember = async (req, res) => {
  try {
    const { role } = req.body;
    
    const updatedMember = await ProjectMember.findOneAndUpdate(
      { projectId: req.params.id, userId: req.params.userId },
      { role },
      { new: true }
    );
    
    if (!updatedMember) {
      return res.status(404).json({ message: 'Project member not found' });
    }
    
    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project member', error: error.message });
  }
};

// Remove project member
export const removeProjectMember = async (req, res) => {
  try {
    const deletedMember = await ProjectMember.findOneAndDelete({
      projectId: req.params.id,
      userId: req.params.userId
    });
    
    if (!deletedMember) {
      return res.status(404).json({ message: 'Project member not found' });
    }
    
    res.status(200).json({ message: 'Project member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing project member', error: error.message });
  }
};

// Update project budget
export const updateProjectBudget = async (req, res) => {
  try {
    const { totalBudget, currency, budgetAlerts } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has permission to update budget (admin or creator)
    const isAdmin = await ProjectMember.exists({
      projectId: req.params.id,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isAdmin && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Admin permission required.' });
    }
    
    // Update budget fields
    if (totalBudget !== undefined) project.budget.totalBudget = totalBudget;
    if (currency) project.budget.currency = currency;
    if (budgetAlerts) {
      project.budget.budgetAlerts = {
        ...project.budget.budgetAlerts,
        ...budgetAlerts
      };
    }
    
    await project.save();
    
    // Check budget thresholds and create notifications if needed
    await checkBudgetThresholds(project);
    
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project budget', error: error.message });
  }
};

// Get all task budgets for a project
export const getProjectTasksBudget = async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get all tasks for this project
    const Task = await import('../models/task.model.js');
    const tasks = await Task.default.find({ projectId });
    
    if (tasks.length === 0) {
      return res.status(200).json([]);
    }
    
    // Get expenses for all tasks
    const Expense = await import('../models/expense.model.js');
    const taskIds = tasks.map(task => task._id);
    const expenses = await Expense.default.find({ taskId: { $in: taskIds } });
    
    // Group expenses by task
    const expensesByTask = expenses.reduce((acc, expense) => {
      if (!acc[expense.taskId]) {
        acc[expense.taskId] = [];
      }
      acc[expense.taskId].push(expense);
      return acc;
    }, {});
    
    // Calculate budget overview for each task
    const taskBudgets = tasks.map(task => {
      // Initialize budget if it doesn't exist
      const taskBudget = task.budget || {
        totalBudget: 0,
        currency: 'USD',
        budgetAlerts: {
          enabled: true,
          thresholds: [{ percentage: 80, notified: false }]
        }
      };
      
      // Get expenses for this task
      const taskExpenses = expensesByTask[task._id] || [];
      const totalExpenses = taskExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const approvedExpenses = taskExpenses
        .filter(exp => exp.status === 'Approved' || exp.status === 'Paid')
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      // Calculate budget utilization
      const budgetUtilization = taskBudget.totalBudget > 0 
        ? (approvedExpenses / taskBudget.totalBudget) * 100 
        : 0;
      
      // Expense breakdown by category
      const categoryBreakdown = taskExpenses.reduce((acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = { count: 0, amount: 0 };
        }
        acc[expense.category].count++;
        acc[expense.category].amount += expense.amount;
        return acc;
      }, {});
      
      // Status breakdown
      const statusBreakdown = taskExpenses.reduce((acc, expense) => {
        if (!acc[expense.status]) {
          acc[expense.status] = { count: 0, amount: 0 };
        }
        acc[expense.status].count++;
        acc[expense.status].amount += expense.amount;
        return acc;
      }, {});
      
      return {
        taskId: task._id,
        taskName: task.title,
        taskPriority: task.priority,
        taskStatus: task.status,
        budget: taskBudget,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        approvedExpenses: Math.round(approvedExpenses * 100) / 100,
        remainingBudget: Math.round((taskBudget.totalBudget - approvedExpenses) * 100) / 100,
        expenseBreakdown: {
          byCategory: categoryBreakdown,
          byStatus: statusBreakdown
        },
        alerts: {
          overBudget: budgetUtilization > 100,
          nearBudgetLimit: budgetUtilization > 80 && budgetUtilization <= 100
        }
      };
    });
    
    res.status(200).json(taskBudgets);
  } catch (error) {
    console.error('Error fetching project tasks budget:', error);
    res.status(500).json({ message: 'Error fetching project tasks budget', error: error.message });
  }
};

// Helper function to check budget thresholds and create notifications
const checkBudgetThresholds = async (project) => {
  try {
    if (!project.budget.budgetAlerts?.enabled || !project.budget.totalBudget) {
      return;
    }

    const totalExpenses = await project.getTotalExpenses();
    const utilization = await project.getBudgetUtilization();
    const thresholds = project.budget.budgetAlerts.thresholds || [];

    // Get project members who should receive notifications (admin and creator)
    const projectMembers = await ProjectMember.find({
      projectId: project._id,
      role: { $in: ['admin'] }
    }).populate('userId', '_id');

    const recipientIds = [...new Set([
      project.createdBy.toString(),
      ...projectMembers.map(pm => pm.userId._id.toString())
    ])];

    // Check each threshold
    for (const threshold of thresholds) {
      if (utilization >= threshold) {
        // Check if notification already exists for this threshold
        const existingNotification = await Notification.findOne({
          recipientId: { $in: recipientIds },
          type: 'budget_threshold',
          'metadata.projectId': project._id,
          'metadata.threshold': threshold,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        });

        if (!existingNotification) {
          // Create notifications for all recipients
          const notifications = recipientIds.map(recipientId => ({
            recipientId,
            type: 'budget_threshold',
            title: `Budget Alert: ${project.name}`,
            message: `Project "${project.name}" has reached ${utilization.toFixed(1)}% of its budget (${project.budget.currency} ${totalExpenses.toLocaleString()} / ${project.budget.currency} ${project.budget.totalBudget.toLocaleString()})`,
            metadata: {
              projectId: project._id,
              threshold,
              utilization,
              totalExpenses,
              totalBudget: project.budget.totalBudget
            }
          }));

          await Notification.insertMany(notifications);
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget thresholds:', error);
  }
};
