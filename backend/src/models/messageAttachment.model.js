import mongoose from 'mongoose';

const MessageAttachmentSchema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriveDocument', required: true }
});

export default mongoose.model("MessageAttachment", MessageAttachmentSchema);
