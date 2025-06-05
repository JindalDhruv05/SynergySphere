import React, { useState, useEffect } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon,
  PaperAirplaneIcon,
  TrashIcon,
  EnvelopeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { invitationApi } from '../../services/invitationApi';
import { useNotifications } from '../../context/NotificationContext';

const ProjectInvitations = ({ projectId }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const { addNotification } = useNotifications();

  const fetchInvitations = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await invitationApi.getSentInvitations(projectId);
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching project invitations:', error);
      addNotification({
        type: 'error',
        message: 'Failed to fetch invitations'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'canceling' }));
      await invitationApi.cancelInvitation(invitationId);
      
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      addNotification({
        type: 'success',
        message: 'Invitation canceled successfully'
      });
    } catch (error) {
      console.error('Error canceling invitation:', error);
      addNotification({
        type: 'error',
        message: 'Failed to cancel invitation'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'resending' }));
      await invitationApi.resendInvitation(invitationId);
      
      addNotification({
        type: 'success',
        message: 'Invitation resent successfully'
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      addNotification({
        type: 'error',
        message: 'Failed to resend invitation'
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
      case 'canceled':
        return 'text-gray-600 bg-gray-100';
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
      case 'canceled':
        return <TrashIcon className="h-4 w-4" />;
      default:
        return <EnvelopeIcon className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [projectId]);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PaperAirplaneIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Sent Invitations
            </h3>
            <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
              {invitations.length}
            </span>
          </div>
          <button
            onClick={fetchInvitations}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Manage invitations sent for this project
        </p>
      </div>

      <div className="p-6">
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <PaperAirplaneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No invitations sent
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No invitations have been sent for this project yet.
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
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-600">
                            {invitation.invitee?.name?.[0] || invitation.email?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {invitation.invitee?.name || invitation.email}
                          </h4>
                          {invitation.invitee && (
                            <p className="text-xs text-gray-500">{invitation.invitee.email}</p>
                          )}
                        </div>
                      </div>
                      <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {getStatusIcon(invitation.status)}
                        <span className="ml-1 capitalize">{invitation.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                      <span>
                        Role: <span className="font-medium capitalize">{invitation.role}</span>
                      </span>
                      <span>
                        Sent: {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                      {invitation.status === 'accepted' && invitation.acceptedAt && (
                        <span>
                          Accepted: {new Date(invitation.acceptedAt).toLocaleDateString()}
                        </span>
                      )}
                      {invitation.status === 'rejected' && invitation.rejectedAt && (
                        <span>
                          Rejected: {new Date(invitation.rejectedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {invitation.message && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{invitation.message}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {invitation.status === 'pending' && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleResendInvitation(invitation._id)}
                      disabled={actionLoading[invitation._id]}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[invitation._id] === 'resending' ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                          Resending...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          Resend
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleCancelInvitation(invitation._id)}
                      disabled={actionLoading[invitation._id]}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading[invitation._id] === 'canceling' ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full mr-2"></div>
                          Canceling...
                        </>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Cancel
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

export default ProjectInvitations;
