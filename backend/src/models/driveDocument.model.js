import mongoose from 'mongoose';

const DriveDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number },
  googleDriveFileId: { type: String, required: true },
  googleDriveWebViewLink: { type: String },
  googleDriveWebContentLink: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  lastModifiedAt: { type: Date, default: Date.now }
});

export default mongoose.model("DriveDocument", DriveDocumentSchema);
