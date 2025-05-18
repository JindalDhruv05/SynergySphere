import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: [
      'task_assigned', 
      'task_updated', 
      'comment_added', 
      'deadline_approaching',
      'project_invitation',
      'document_shared'
    ], 
    required: true 
  },
  content: { type: String, required: true },
  relatedItemId: { type: mongoose.Schema.Types.ObjectId }, // Could be taskId, projectId, etc.
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries of unread notifications
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model("Notification", NotificationSchema);
// This model is used to manage notifications for users in the system.