import Expense from '../models/expense.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import ProjectMember from '../models/projectMember.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { createNotification } from './notification.controller.js';

// Get all expenses for a project
export const getProjectExpenses = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { category, status, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = { projectId };
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.dateIncurred = {};
      if (startDate) filter.dateIncurred.$gte = new Date(startDate);
      if (endDate) filter.dateIncurred.$lte = new Date(endDate);
    }
    
    const expenses = await Expense.find(filter)
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 });
    
    // Calculate totals
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const approvedAmount = expenses
      .filter(exp => exp.status === 'Approved' || exp.status === 'Paid')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    res.status(200).json({
      expenses,
      summary: {
        totalExpenses: expenses.length,
        totalAmount,
        approvedAmount,
        pendingAmount: totalAmount - approvedAmount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
};

// Get expenses for a specific task
export const getTaskExpenses = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const expenses = await Expense.find({ taskId })
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    res.status(200).json({
      expenses,
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task expenses', error: error.message });
  }
};

// Create new expense
export const createExpense = async (req, res) => {
  try {
    const { 
      projectId, 
      taskId, 
      title, 
      description, 
      amount, 
      currency, 
      category, 
      dateIncurred,
      notes 
    } = req.body;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is project member
    const isMember = await ProjectMember.exists({ 
      projectId, 
      userId: req.user.id 
    });
    
    if (!isMember && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If taskId provided, verify task exists and belongs to project
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, projectId });
      if (!task) {
        return res.status(404).json({ message: 'Task not found or does not belong to this project' });
      }
    }
    
    const expense = new Expense({
      projectId,
      taskId: taskId || null,
      title,
      description,
      amount,
      currency: currency || 'USD',
      category,
      dateIncurred: dateIncurred || new Date(),
      createdBy: req.user.id,
      notes
    });
      await expense.save();
    
    // Check budget thresholds after creating expense
    await checkBudgetThresholds(project);
    
    // Populate the created expense
    const populatedExpense = await Expense.findById(expense._id)
      .populate('createdBy', 'name email avatar')
      .populate('taskId', 'title');
    
    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check permissions - only creator can edit pending expenses
    if (expense.createdBy.toString() !== req.user.id && expense.status !== 'Pending') {
      return res.status(403).json({ message: 'Cannot edit approved/rejected expenses' });
    }
    
    // Prevent updating certain fields after approval
    if (expense.status !== 'Pending') {
      delete updates.amount;
      delete updates.category;
      delete updates.projectId;
      delete updates.taskId;
    }
      const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('createdBy', 'name email avatar')
     .populate('approvedBy', 'name email')
     .populate('taskId', 'title');
    
    // Check budget thresholds after updating expense (if amount changed)
    if (updates.amount !== undefined) {
      const project = await Project.findById(expense.projectId);
      if (project) {
        await checkBudgetThresholds(project);
      }
    }
    
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
};

// Approve expense
export const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if user has permission to approve (project admin or creator)
    const project = await Project.findById(expense.projectId);
    const isAdmin = await ProjectMember.exists({
      projectId: expense.projectId,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isAdmin && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Admin permission required.' });
    }
    
  await expense.approve(req.user.id);
  
  // Create notification for expense creator
  const approver = await User.findById(req.user.id).select('name');
  const notificationTitle = 'Expense Approved';
  const notificationMessage = `Your expense "${expense.title}" (${expense.currency} ${expense.amount}) has been approved by ${approver.name}`;
  
  await createNotification(
    expense.createdBy,
    'expense_approved',
    notificationTitle,
    notificationMessage,
    expense._id,
    {
      expenseId: expense._id,
      projectId: expense.projectId,
      taskId: expense.taskId,
      amount: expense.amount,
      currency: expense.currency,
      approvedBy: req.user.id
    }
  );
  
  const updatedExpense = await Expense.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email')
      .populate('taskId', 'title');
    
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error approving expense', error: error.message });
  }
};

// Reject expense
export const rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if user has permission to reject (project admin or creator)
    const project = await Project.findById(expense.projectId);
    const isAdmin = await ProjectMember.exists({
      projectId: expense.projectId,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isAdmin && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Admin permission required.' });
    }
    
  await expense.reject(req.user.id, reason);
  
  // Create notification for expense creator
  const rejector = await User.findById(req.user.id).select('name');
  const notificationTitle = 'Expense Rejected';
  const notificationMessage = `Your expense "${expense.title}" (${expense.currency} ${expense.amount}) has been rejected by ${rejector.name}${reason ? `. Reason: ${reason}` : ''}`;
  
  await createNotification(
    expense.createdBy,
    'expense_rejected',
    notificationTitle,
    notificationMessage,
    expense._id,
    {
      expenseId: expense._id,
      projectId: expense.projectId,
      taskId: expense.taskId,
      amount: expense.amount,
      currency: expense.currency,
      rejectedBy: req.user.id,
      reason: reason || null
    }
  );
  
  const updatedExpense = await Expense.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email')
      .populate('taskId', 'title');
    
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting expense', error: error.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Only creator can delete pending expenses
    if (expense.createdBy.toString() !== req.user.id || expense.status !== 'Pending') {
      return res.status(403).json({ message: 'Can only delete your own pending expenses' });
    }
    
    await Expense.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
};

// Get project budget overview
export const getProjectBudgetOverview = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get expense summary
    const expenses = await Expense.find({ projectId });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const approvedExpenses = expenses
      .filter(exp => exp.status === 'Approved' || exp.status === 'Paid')
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate budget utilization
    const budgetUtilization = project.budget.totalBudget > 0 
      ? (approvedExpenses / project.budget.totalBudget) * 100 
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
      budget: project.budget,
      totalExpenses,
      approvedExpenses,
      pendingExpenses: totalExpenses - approvedExpenses,
      remainingBudget: Math.max(0, project.budget.totalBudget - approvedExpenses),
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      categoryBreakdown,
      expenseCount: expenses.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budget overview', error: error.message });
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
