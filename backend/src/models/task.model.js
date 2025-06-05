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
  },
  googleDriveFolderId: { type: String }
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

export default mongoose.model("Task", TaskSchema);
