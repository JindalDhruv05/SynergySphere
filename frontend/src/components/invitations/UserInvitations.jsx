import React, { useState, useEffect } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { invitationApi } from '../../services/invitationApi';
import { useNotifications } from '../../context/NotificationContext';

const UserInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const { addNotification } = useNotifications();

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationApi.getReceivedInvitations();
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      addNotification({
        type: 'error',
        message: 'Failed to fetch invitations'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'accepting' }));
      await invitationApi.acceptInvitation(invitationId);
      
      // Remove from list or update status
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      addNotification({
        type: 'success',
        message: 'Invitation accepted successfully!'
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      addNotification({
        type: 'error',
        message: 'Failed to accept invitation'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'rejecting' }));
      await invitationApi.rejectInvitation(invitationId);
      
      // Remove from list or update status
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      addNotification({
        type: 'success',
        message: 'Invitation rejected'
      });
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      addNotification({
        type: 'error',
        message: 'Failed to reject invitation'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'accepted':
        return <CheckIcon className="h-4 w-4" />;
      case 'rejected':
        return <XMarkIcon className="h-4 w-4" />;
      default:
        return <EnvelopeIcon className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <UserGroupIcon className="h-6 w-6 text-indigo-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Project Invitations
          </h2>
          <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
            {invitations.filter(inv => inv.status === 'pending').length}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Manage your project invitations
        </p>
      </div>

      <div className="p-6">
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No invitations
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any project invitations at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {invitation.project?.name || 'Unknown Project'}
                      </h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {getStatusIcon(invitation.status)}
                        <span className="ml-1 capitalize">{invitation.status}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {invitation.project?.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>
                        From: <span className="font-medium">{invitation.inviter?.name || invitation.inviter?.email}</span>
                      </span>
                      <span>
                        Role: <span className="font-medium capitalize">{invitation.role}</span>
                      </span>
                      <span>
                        Invited: {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {invitation.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{invitation.message}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {invitation.status === 'pending' && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleAcceptInvitation(invitation._id)}
                      disabled={actionLoading[invitation._id]}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[invitation._id] === 'accepting' ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Accept
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleRejectInvitation(invitation._id)}
                      disabled={actionLoading[invitation._id]}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[invitation._id] === 'rejecting' ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInvitations;
