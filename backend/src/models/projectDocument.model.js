import mongoose from 'mongoose';

const ProjectDocumentSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriveDocument', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

// Compound index to ensure a document is only linked once to a project
ProjectDocumentSchema.index({ documentId: 1, projectId: 1 }, { unique: true });

export default mongoose.model("ProjectDocument", ProjectDocumentSchema);
