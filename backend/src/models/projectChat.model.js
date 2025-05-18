import mongoose from 'mongoose';

const ProjectChatSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

// Method to sync chat members with project members
ProjectChatSchema.methods.syncWithProjectMembers = async function() {
  const ChatMember = mongoose.model('ChatMember');
  const ProjectMember = mongoose.model('ProjectMember');
  
  // Get all project members
  const projectMembers = await ProjectMember.find({ projectId: this.projectId });
  
  // Add each project member to the chat
  for (const member of projectMembers) {
    await ChatMember.findOneAndUpdate(
      { chatId: this.chatId, userId: member.userId },
      { chatId: this.chatId, userId: member.userId },
      { upsert: true }
    );
  }
};

export default mongoose.model("ProjectChat", ProjectChatSchema);
