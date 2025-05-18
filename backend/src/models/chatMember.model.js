import mongoose from 'mongoose';

const ChatMemberSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now }
});

// Compound index to ensure a user is only added once per chat
ChatMemberSchema.index({ chatId: 1, userId: 1 }, { unique: true });

export default mongoose.model("ChatMember", ChatMemberSchema);
