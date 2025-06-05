import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String },  status: { 
    type: String, 
    enum: ['To-Do', 'In Progress', 'Done'], 
    default: 'To-Do' 
  },
  statusConfirmed: { 
    type: Boolean, 
    default: false 
  },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },  googleDriveFolderId: { type: String },
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

// Index for faster subtask queries
TaskSchema.index({ parentTaskId: 1 });

// Method to get all subtasks
TaskSchema.methods.getSubtasks = function() {
  return mongoose.model('Task').find({ parentTaskId: this._id });
};

// Method to get all assigned members
TaskSchema.methods.getMembers = function() {
  return mongoose.model('TaskMember').find({ taskId: this._id }).populate('userId');
};

// Method to check if task is overdue
TaskSchema.methods.isOverdue = function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
};

// Method to calculate total expenses for this task
TaskSchema.methods.getTotalExpenses = async function() {
  const Expense = mongoose.model('Expense');
  const expenses = await Expense.find({ taskId: this._id });
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// Method to calculate budget utilization percentage
TaskSchema.methods.getBudgetUtilization = async function() {
  if (!this.budget.totalBudget || this.budget.totalBudget === 0) return 0;
  const totalExpenses = await this.getTotalExpenses();
  return (totalExpenses / this.budget.totalBudget) * 100;
};

// Method to check if budget threshold is exceeded
TaskSchema.methods.checkBudgetThreshold = async function() {
  const utilization = await this.getBudgetUtilization();
  const thresholds = this.budget.budgetAlerts.thresholds;
  
  return thresholds.some(threshold => 
    utilization >= threshold.percentage && !threshold.notified
  );
};

export default mongoose.model("Task", TaskSchema);
