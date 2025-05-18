import mongoose from 'mongoose';

const TaskDocumentSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriveDocument', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true }
});

// Compound index to ensure a document is only linked once to a task
TaskDocumentSchema.index({ documentId: 1, taskId: 1 }, { unique: true });

export default mongoose.model("TaskDocument", TaskDocumentSchema);
