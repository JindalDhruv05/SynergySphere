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

export default mongoose.model("Project", ProjectSchema);
