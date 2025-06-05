import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  type: { 

  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 

    type: String, 
    enum: [
      'task_assigned', 
      'task_updated', 
      'comment_added', 
      'deadline_approaching',
      'project_invitation',
      'project_member_added',
      'document_shared',
      'budget_threshold',
      'chat_ping'    
], 
    required: true 
  }},
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedItemId: { type: mongoose.Schema.Types.ObjectId }, // Could be taskId, projectId, etc.
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data for notifications
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries of unread notifications
NotificationSchema.index({ recipientId: 1, read: 1 });
NotificationSchema.index({ type: 1, 'metadata.projectId': 1, 'metadata.threshold': 1 });

export default mongoose.model("Notification", NotificationSchema);
