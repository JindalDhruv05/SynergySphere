import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  googleDriveFolderId: { type: String }
}, { timestamps: true });

// Method to get all members of a project
ProjectSchema.methods.getMembers = function() {
  return mongoose.model('ProjectMember').find({ projectId: this._id }).populate('userId');
};

// Method to check if a user is a member
ProjectSchema.methods.hasMember = function(userId) {
  return mongoose.model('ProjectMember').exists({ projectId: this._id, userId: userId });
};

export default mongoose.model("Project", ProjectSchema);
