import mongoose from 'mongoose';

const ProjectInvitationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['member', 'admin'], 
    default: 'member' 
  },
  message: { type: String }, // Optional invitation message
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });

// Compound index to prevent duplicate pending invitations
ProjectInvitationSchema.index({ projectId: 1, invitedUser: 1, status: 1 });

// Index for faster queries
ProjectInvitationSchema.index({ invitedUser: 1, status: 1 });
ProjectInvitationSchema.index({ invitedBy: 1 });
ProjectInvitationSchema.index({ expiresAt: 1 });

// Method to check if invitation is expired
ProjectInvitationSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Method to accept invitation
ProjectInvitationSchema.methods.accept = function() {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  return this.save();
};

// Method to reject invitation
ProjectInvitationSchema.methods.reject = function() {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  return this.save();
};

// Method to expire invitation
ProjectInvitationSchema.methods.expire = function() {
  this.status = 'expired';
  return this.save();
};

export default mongoose.model("ProjectInvitation", ProjectInvitationSchema);
