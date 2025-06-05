import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  title: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  category: { 
    type: String, 
    enum: [
      'Software/Tools', 
      'Travel', 
      'Materials', 
      'Services', 
      'Equipment', 
      'Marketing', 
      'Training',
      'Other'
    ], 
    default: 'Other' 
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
    default: 'Pending'
  },
  dateIncurred: { type: Date, default: Date.now },
  receipt: {
    filename: { type: String },
    url: { type: String },
    uploadedAt: { type: Date }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

// Index for efficient queries
ExpenseSchema.index({ projectId: 1, createdAt: -1 });
ExpenseSchema.index({ taskId: 1 });
ExpenseSchema.index({ createdBy: 1 });

// Method to approve expense
ExpenseSchema.methods.approve = function(approverId) {
  this.status = 'Approved';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  return this.save();
};

// Method to reject expense
ExpenseSchema.methods.reject = function(approverId, reason) {
  this.status = 'Rejected';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.notes = reason;
  return this.save();
};

export default mongoose.model("Expense", ExpenseSchema);