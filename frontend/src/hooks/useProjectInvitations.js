import { useState, useEffect, useCallback } from 'react';
import { invitationApi } from '../services/invitationApi';
import { useNotification } from '../context/NotificationContext';

export const useProjectInvitations = () => {
  const [userInvitations, setUserInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { fetchNotifications } = useNotification();

  // Fetch user's received invitations
  const fetchUserInvitations = useCallback(async (status = 'pending') => {
    setLoading(true);
    setError(null);
    try {
      const invitations = await invitationApi.getUserInvitations(status);
      setUserInvitations(invitations);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invitations');
      console.error('Error fetching user invitations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Accept an invitation
  const acceptInvitation = useCallback(async (invitationId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invitationApi.acceptInvitation(invitationId);
      
      // Remove the accepted invitation from the list
      setUserInvitations(prev => 
        prev.filter(invitation => invitation._id !== invitationId)
      );
      
      // Refresh notifications to show the acceptance notification
      await fetchNotifications();
      
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
      console.error('Error accepting invitation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  // Reject an invitation
  const rejectInvitation = useCallback(async (invitationId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invitationApi.rejectInvitation(invitationId);
      
      // Remove the rejected invitation from the list
      setUserInvitations(prev => 
        prev.filter(invitation => invitation._id !== invitationId)
      );
      
      // Refresh notifications to show the rejection notification
      await fetchNotifications();
      
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject invitation');
      console.error('Error rejecting invitation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  // Send an invitation
  const sendInvitation = useCallback(async (projectId, userId, role, message) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invitationApi.sendInvitation(projectId, userId, role, message);
      
      // Refresh notifications to show the sent invitation
      await fetchNotifications();
      
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
      console.error('Error sending invitation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  // Get project invitations (for project managers)
  const fetchProjectInvitations = useCallback(async (projectId, status) => {
    setLoading(true);
    setError(null);
    try {
      const invitations = await invitationApi.getProjectInvitations(projectId, status);
      return invitations;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project invitations');
      console.error('Error fetching project invitations:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel an invitation
  const cancelInvitation = useCallback(async (invitationId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invitationApi.cancelInvitation(invitationId);
      
      // Refresh notifications
      await fetchNotifications();
      
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel invitation');
      console.error('Error canceling invitation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  // Load user invitations on mount
  useEffect(() => {
    fetchUserInvitations();
  }, [fetchUserInvitations]);

  return {
    userInvitations,
    loading,
    error,
    acceptInvitation,
    rejectInvitation,
    sendInvitation,
    fetchUserInvitations,
    fetchProjectInvitations,
    cancelInvitation
  };
};

export default useProjectInvitations;
