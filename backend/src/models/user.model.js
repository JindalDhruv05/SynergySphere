import mongoose from 'mongoose';
import bcrypt from 'mongoose-bcrypt';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, bcrypt: true },
  avatar: { type: String },
  googleDriveAccessToken: { type: String },
  googleDriveRefreshToken: { type: String }
}, { timestamps: true });

UserSchema.plugin(bcrypt);

// Method to check if user is a member of a project
UserSchema.methods.isProjectMember = function(projectId) {
  return mongoose.model('ProjectMember').exists({ 
    projectId: projectId, 
    userId: this._id 
  });
};

// Method to check if user is assigned to a task
UserSchema.methods.isTaskMember = function(taskId) {
  return mongoose.model('TaskMember').exists({ 
    taskId: taskId, 
    userId: this._id 
  });
};

export default mongoose.model("User", UserSchema);
