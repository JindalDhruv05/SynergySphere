import mongoose from 'mongoose';

const DriveDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number },
  // Google Drive fields (legacy)
  googleDriveFileId: { type: String },
  googleDriveWebViewLink: { type: String },
  googleDriveWebContentLink: { type: String },  // Cloudinary fields
  url: { type: String },
  publicId: { type: String },
  format: { type: String },
  resourceType: { type: String }, // 'image', 'video', or 'raw'
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  lastModifiedAt: { type: Date, default: Date.now }
});

export default mongoose.model("DriveDocument", DriveDocumentSchema);
