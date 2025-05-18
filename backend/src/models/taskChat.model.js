import mongoose from 'mongoose';

const TaskChatSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true }
});

// Method to sync chat members with task members
TaskChatSchema.methods.syncWithTaskMembers = async function() {
  const ChatMember = mongoose.model('ChatMember');
  const TaskMember = mongoose.model('TaskMember');
  
  // Get all task members
  const taskMembers = await TaskMember.find({ taskId: this.taskId });
  
  // Add each task member to the chat
  for (const member of taskMembers) {
    await ChatMember.findOneAndUpdate(
      { chatId: this.chatId, userId: member.userId },
      { chatId: this.chatId, userId: member.userId },
      { upsert: true }
    );
  }
};

export default mongoose.model("TaskChat", TaskChatSchema);
