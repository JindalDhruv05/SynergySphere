import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Index for faster message retrieval by chat
MessageSchema.index({ chatId: 1, createdAt: -1 });

// Method to check if a specific user has read the message
MessageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(id => id.equals(userId));
};

// Method to mark as read by a user
MessageSchema.methods.markAsRead = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

export default mongoose.model("Message", MessageSchema);
