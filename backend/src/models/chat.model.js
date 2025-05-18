import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['project', 'task', 'personal', 'group'],
    required: true 
  },
  name: { type: String },
}, { timestamps: true });

// Method to get all members of a chat
ChatSchema.methods.getMembers = function() {
  return mongoose.model('ChatMember').find({ chatId: this._id }).populate('userId');
};

// Method to get all messages in a chat
ChatSchema.methods.getMessages = function(limit = 50, skip = 0) {
  return mongoose.model('Message')
    .find({ chatId: this._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'name avatar');
};

export default mongoose.model("Chat", ChatSchema);
