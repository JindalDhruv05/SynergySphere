import api from './api';

// Project Invitation API functions
export const invitationApi = {  // Send invitation to join a project
  sendInvitation: async (projectId, userId, role, message) => {
    const requestBody = {
      projectId,
      userId,
      role: role || 'member',
      message
    };
    
    const response = await api.post('/project-invitations/send', requestBody);
    return response.data;
  },
  // Get invitations for the current user (received invitations)
  getUserInvitations: async (status = 'pending') => {
    const response = await api.get(`/project-invitations/user?status=${status}`);
    return response.data;
  },

  // Get received invitations (alias for getUserInvitations)
  getReceivedInvitations: async (status) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/project-invitations/user${params}`);
    return response;
  },

  // Get all invitations for a specific project (sent invitations)
  getProjectInvitations: async (projectId, status) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/project-invitations/project/${projectId}${params}`);
    return response.data;
  },

  // Get sent invitations for a project (alias for getProjectInvitations)
  getSentInvitations: async (projectId, status) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/project-invitations/project/${projectId}${params}`);
    return response;
  },

  // Accept an invitation
  acceptInvitation: async (invitationId) => {
    const response = await api.patch(`/project-invitations/${invitationId}/accept`);
    return response.data;
  },

  // Reject an invitation
  rejectInvitation: async (invitationId) => {
    const response = await api.patch(`/project-invitations/${invitationId}/reject`);
    return response.data;
  },

  // Cancel an invitation (only by sender or project admin)
  cancelInvitation: async (invitationId) => {
    const response = await api.patch(`/project-invitations/${invitationId}/cancel`);
    return response.data;
  },

  // Resend an invitation
  resendInvitation: async (invitationId) => {
    const response = await api.patch(`/project-invitations/${invitationId}/resend`);
    return response.data;
  }
};

export default invitationApi;
