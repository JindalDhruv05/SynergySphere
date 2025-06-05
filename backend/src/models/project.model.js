import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  googleDriveFolderId: { type: String },
  budget: {
    totalBudget: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    budgetAlerts: {
      enabled: { type: Boolean, default: true },
      thresholds: [{
        percentage: { type: Number, default: 80 },
        notified: { type: Boolean, default: false }
      }]
    }
  }
}, { timestamps: true });

// Method to get all members of a project
ProjectSchema.methods.getMembers = function() {
  return mongoose.model('ProjectMember').find({ projectId: this._id }).populate('userId');
};

// Method to check if a user is a member
ProjectSchema.methods.hasMember = function(userId) {
  return mongoose.model('ProjectMember').exists({ projectId: this._id, userId: userId });
};

// Method to calculate total expenses across all tasks
ProjectSchema.methods.getTotalExpenses = async function() {
  const Expense = mongoose.model('Expense');
  const expenses = await Expense.find({ projectId: this._id });
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// Method to calculate budget utilization percentage
ProjectSchema.methods.getBudgetUtilization = async function() {
  if (!this.budget.totalBudget || this.budget.totalBudget === 0) return 0;
  const totalExpenses = await this.getTotalExpenses();
  return (totalExpenses / this.budget.totalBudget) * 100;
};

// Method to check if budget threshold is exceeded
ProjectSchema.methods.checkBudgetThreshold = async function() {
  const utilization = await this.getBudgetUtilization();
  const thresholds = this.budget.budgetAlerts.thresholds;
  
  return thresholds.some(threshold => 
    utilization >= threshold.percentage && !threshold.notified
  );
};

// Method to get all tasks for this project
ProjectSchema.methods.getAllTasks = async function() {
  const Task = mongoose.model('Task');
  return await Task.find({ projectId: this._id });
};

// Method to check if a task and all its subtasks are completed
ProjectSchema.methods.isTaskCompleted = async function(task) {
  // Check if the task itself is done and confirmed
  if (task.status !== 'Done' || !task.statusConfirmed) {
    return false;
  }
  
  // Get all subtasks
  const Task = mongoose.model('Task');
  const subtasks = await Task.find({ parentTaskId: task._id });
  
  // If no subtasks, the task is completed
  if (subtasks.length === 0) {
    return true;
  }
  
  // Check if all subtasks are completed recursively
  for (const subtask of subtasks) {
    const isSubtaskCompleted = await this.isTaskCompleted(subtask);
    if (!isSubtaskCompleted) {
      return false;
    }
  }
  
  return true;
};

// Method to check if the entire project is completed
ProjectSchema.methods.isProjectCompleted = async function() {
  const tasks = await this.getAllTasks();
  
  // If no tasks exist, project is considered incomplete
  if (tasks.length === 0) {
    return false;
  }
  
  // Get only parent tasks (tasks without parentTaskId)
  const parentTasks = tasks.filter(task => !task.parentTaskId);
  
  // If no parent tasks, but subtasks exist, it's an edge case - consider incomplete
  if (parentTasks.length === 0) {
    return false;
  }
  
  // Check if all parent tasks (and their subtasks) are completed
  for (const task of parentTasks) {
    const isCompleted = await this.isTaskCompleted(task);
    if (!isCompleted) {
      return false;
    }
  }
  
  return true;
};

// Method to get project completion statistics
ProjectSchema.methods.getCompletionStats = async function() {
  const tasks = await this.getAllTasks();
  const parentTasks = tasks.filter(task => !task.parentTaskId);
  
  let completedTasks = 0;
  let totalTasks = parentTasks.length;
  
  for (const task of parentTasks) {
    const isCompleted = await this.isTaskCompleted(task);
    if (isCompleted) {
      completedTasks++;
    }
  }
  
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isFullyCompleted = await this.isProjectCompleted();
  
  return {
    totalTasks,
    completedTasks,
    completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
    isFullyCompleted,
    allTasksCount: tasks.length, // Total including subtasks
    parentTasksCount: totalTasks
  };
};

export default mongoose.model("Project", ProjectSchema);
