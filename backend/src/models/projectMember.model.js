import mongoose from 'mongoose';

const ProjectMemberSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['admin', 'member', 'viewer'], 
    default: 'member' 
  },
  joinedAt: { type: Date, default: Date.now }
});

// Compound index to ensure a user is only added once per project
ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export default mongoose.model("ProjectMember", ProjectMemberSchema);
