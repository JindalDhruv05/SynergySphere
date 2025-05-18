import mongoose from 'mongoose';

const DrivePermissionSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriveDocument', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['viewer', 'commenter', 'editor', 'owner'],
    required: true 
  },
  type: { 
    type: String, 
    enum: ['user', 'group', 'domain', 'anyone'],
    default: 'user' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure a user has only one permission record per document
DrivePermissionSchema.index({ documentId: 1, userId: 1 }, { unique: true });

export default mongoose.model("DrivePermission", DrivePermissionSchema);
