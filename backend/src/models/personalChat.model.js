import mongoose from 'mongoose';

const PersonalChatSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  isDirectMessage: { type: Boolean, default: true }
});

export default mongoose.model("PersonalChat", PersonalChatSchema);
