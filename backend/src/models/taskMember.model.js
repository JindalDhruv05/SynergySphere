import mongoose from 'mongoose';

const TaskMemberSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['responsible', 'accountable', 'consulted', 'informed'],
    default: 'responsible'
  },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Compound index to ensure a user is only added once per task
TaskMemberSchema.index({ taskId: 1, userId: 1 }, { unique: true });

export default mongoose.model("TaskMember", TaskMemberSchema);
