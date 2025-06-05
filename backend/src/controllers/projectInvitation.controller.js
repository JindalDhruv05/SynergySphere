import ProjectInvitation from '../models/projectInvitation.model.js';
import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import User from '../models/user.model.js';
import ProjectChat from '../models/projectChat.model.js';
import { createNotification } from './notification.controller.js';
import { getSocketInstance } from '../socket/socketHandlers.js';

// Send project invitation
export const sendInvitation = async (req, res) => {
  try {
    const { projectId, userId, role, message } = req.body;
    
    // userId is required
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    // Check if project exists and user has admin permission
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isAdmin = await ProjectMember.exists({
      projectId,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isAdmin && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project admins can send invitations' });
    }
    
    // Find the user to invite
    const invitedUser = await User.findById(userId);
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    const existingMember = await ProjectMember.exists({
      projectId,
      userId: invitedUser._id
    });
    
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a project member' });
    }
    
    // Check if there's already a pending invitation
    const existingInvitation = await ProjectInvitation.findOne({
      projectId,
      invitedUser: invitedUser._id,
      status: 'pending'
    });
    
    if (existingInvitation && !existingInvitation.isExpired()) {
      return res.status(400).json({ message: 'Pending invitation already exists' });
    }
      // Create invitation
    const invitation = new ProjectInvitation({
      projectId,
      invitedBy: req.user.id,
      invitedUser: invitedUser._id,
      role: role || 'member',
      message
    });
    
    await invitation.save();
    
    // Send notification to invited user
    const inviter = await User.findById(req.user.id).select('name');
    await createNotification(
      invitedUser._id,
      'project_invitation',
      `${inviter.name} invited you to join project: ${project.name}`,
      invitation._id
    );
    
    // Send real-time notification
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${invitedUser._id}`).emit('notification', {
        type: 'project_invitation',
        title: 'Project Invitation',
        message: `${inviter.name} invited you to join project: ${project.name}`,
        relatedId: invitation._id,
        relatedType: 'invitation'
      });
    }
    
    const populatedInvitation = await ProjectInvitation.findById(invitation._id)
      .populate('projectId', 'name description')
      .populate('invitedBy', 'name email avatar')
      .populate('invitedUser', 'name email avatar');
    
    res.status(201).json(populatedInvitation);
  } catch (error) {
    res.status(500).json({ message: 'Error sending project invitation', error: error.message });
  }
};

// Get user's project invitations
export const getUserInvitations = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const query = { 
      invitedUser: req.user.id,
      status
    };
    
    // Filter out expired invitations for pending status
    if (status === 'pending') {
      query.expiresAt = { $gt: new Date() };
    }
    
    const invitations = await ProjectInvitation.find(query)
      .populate('projectId', 'name description')
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invitations', error: error.message });
  }
};

// Accept project invitation
export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await ProjectInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if user is the invited user
    if (invitation.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
    }
    
    // Check if invitation is still pending and not expired
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation has already been responded to' });
    }
    
    if (invitation.isExpired()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    
    // Check if user is already a member (in case they were added directly)
    const existingMember = await ProjectMember.exists({
      projectId: invitation.projectId,
      userId: req.user.id
    });
    
    if (existingMember) {
      await invitation.accept();
      return res.status(400).json({ message: 'You are already a member of this project' });
    }
    
    // Accept invitation and add user to project
    await invitation.accept();
    
    const projectMember = new ProjectMember({
      projectId: invitation.projectId,
      userId: req.user.id,
      role: invitation.role
    });
    
    await projectMember.save();
      // Sync project chat members if chat exists
    const projectChat = await ProjectChat.findOne({ projectId: invitation.projectId });
    if (projectChat) {
      await projectChat.syncWithProjectMembers();
    }    // Notify the person who sent the invitation
    const currentUser = await User.findById(req.user.id);
    const project = await Project.findById(invitation.projectId);
    
    await createNotification(
      invitation.invitedBy,
      'project_invitation_accepted',
      'Invitation Accepted',
      `${currentUser.name} accepted your invitation to join "${project.name}"`,
      invitation.projectId,
      { invitedUserId: req.user.id, invitationId: invitation._id }
    );

    // Send real-time notification
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${invitation.invitedBy}`).emit('notification', {
        type: 'project_invitation_accepted',
        title: 'Invitation Accepted',
        message: `${currentUser.name} accepted your invitation to join "${project.name}"`,
        relatedId: invitation.projectId,
        relatedType: 'project'
      });
    }
    
    const populatedInvitation = await ProjectInvitation.findById(invitation._id)
      .populate('projectId', 'name description')
      .populate('invitedBy', 'name email avatar');
    
    res.status(200).json({
      message: 'Invitation accepted successfully',
      invitation: populatedInvitation,
      projectMember
    });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
};

// Reject project invitation
export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await ProjectInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if user is the invited user
    if (invitation.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
    }
    
    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation has already been responded to' });
    }
      await invitation.reject();    // Notify the person who sent the invitation
    const currentUser = await User.findById(req.user.id);
    const project = await Project.findById(invitation.projectId);
    
    await createNotification(
      invitation.invitedBy,
      'project_invitation_rejected',
      'Invitation Declined',
      `${currentUser.name} declined your invitation to join "${project.name}"`,
      invitation.projectId,
      { invitedUserId: req.user.id, invitationId: invitation._id }
    );

    // Send real-time notification
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${invitation.invitedBy}`).emit('notification', {
        type: 'project_invitation_rejected',
        title: 'Invitation Declined',
        message: `${currentUser.name} declined your invitation to join "${project.name}"`,
        relatedId: invitation.projectId,
        relatedType: 'project'
      });
    }
    
    const populatedInvitation = await ProjectInvitation.findById(invitation._id)
      .populate('projectId', 'name description')
      .populate('invitedBy', 'name email avatar');
    
    res.status(200).json({
      message: 'Invitation rejected',
      invitation: populatedInvitation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting invitation', error: error.message });
  }
};

// Get project invitations (for project admins)
export const getProjectInvitations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    
    // Check if user has admin permission
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isAdmin = await ProjectMember.exists({
      projectId,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isAdmin && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project admins can view invitations' });
    }
    
    const query = { projectId };
    if (status) {
      query.status = status;
    }
    
    const invitations = await ProjectInvitation.find(query)
      .populate('invitedBy', 'name email avatar')
      .populate('invitedUser', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project invitations', error: error.message });
  }
};

// Cancel project invitation (for project admins)
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
      const invitation = await ProjectInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if user has admin permission
    const project = await Project.findById(invitation.projectId);
    const isAdmin = await ProjectMember.exists({
      projectId: invitation.projectId,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isAdmin && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project admins can cancel invitations' });
    }
    
    // Can only cancel pending invitations
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending invitations' });
    }
      await ProjectInvitation.findByIdAndDelete(invitationId);
    
    res.status(200).json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling invitation', error: error.message });
  }
};

// Resend project invitation
export const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await ProjectInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if user has admin permission
    const project = await Project.findById(invitation.projectId);
    const isAdmin = await ProjectMember.exists({
      projectId: invitation.projectId,
      userId: req.user.id,
      role: 'admin'
    });
    
    if (!isAdmin && project.createdBy.toString() !== req.user.id && invitation.invitedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project admins or invitation sender can resend invitations' });
    }
    
    // Can only resend pending invitations
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Can only resend pending invitations' });
    }
    
    // Reset expiration date (extend for another 7 days)
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();
      // Send notification to invited user again
    const inviter = await User.findById(invitation.invitedBy).select('name');
    await createNotification(
      invitation.invitedUser,
      'project_invitation',
      'Project Invitation (Resent)',
      `${inviter.name} resent invitation to join project: ${project.name}`,
      invitation._id,
      { projectId: invitation.projectId, inviterId: invitation.invitedBy }
    );
    
    // Send real-time notification
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${invitation.invitedUser}`).emit('notification', {
        type: 'project_invitation',
        title: 'Project Invitation (Resent)',
        message: `${inviter.name} resent invitation to join project: ${project.name}`,
        relatedId: invitation._id,
        relatedType: 'invitation'
      });
    }
    
    const populatedInvitation = await ProjectInvitation.findById(invitation._id)
      .populate('projectId', 'name description')
      .populate('invitedBy', 'name email avatar')
      .populate('invitedUser', 'name email avatar');
    
    res.status(200).json({
      message: 'Invitation resent successfully',
      invitation: populatedInvitation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resending invitation', error: error.message });
  }
};
