import { useState, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  XMarkIcon, 
  ClockIcon, 
  CheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { invitationApi } from '../../services/invitationApi';

export default function ProjectInvitations({ projectId, projectName }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (projectId) {
      fetchInvitations();
    }
  }, [projectId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await invitationApi.getProjectInvitations(projectId);
      setInvitations(data);
    } catch (err) {
      setError('Failed to load invitations');
      console.error('Error fetching project invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'cancelling' }));
      await invitationApi.cancelInvitation(invitationId);
      
      // Remove cancelled invitation from the list
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel invitation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  const handleResend = async (invitationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'resending' }));
      await invitationApi.resendInvitation(invitationId);
      
      // Refresh the invitations list to show updated expiration
      await fetchInvitations();
      
      alert('Invitation resent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend invitation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XMarkIcon className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'expired':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return baseClasses;
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Invitations for {projectName}
      </h3>
      
      {invitations.length === 0 ? (
        <p className="text-gray-500">No invitations sent yet</p>
      ) : (
        <div className="space-y-6">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">
                Pending ({pendingInvitations.length})
              </h4>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {invitation.invitedUser?.name || invitation.email}
                          </span>
                          <span className={getStatusBadge(invitation.status)}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Email: {invitation.invitedUser?.email || invitation.email}
                        </p>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Role: <span className="font-medium capitalize">{invitation.role}</span>
                        </p>
                        
                        {invitation.message && (
                          <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mb-2">
                            {invitation.message}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400">
                          Sent: {new Date(invitation.createdAt).toLocaleDateString()} • 
                          Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          onClick={() => handleResend(invitation._id)}
                          disabled={actionLoading[invitation._id]}
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          {actionLoading[invitation._id] === 'resending' ? (
                            <>
                              <div className="animate-spin w-3 h-3 border border-blue-700 border-t-transparent rounded-full mr-1"></div>
                              Resending...
                            </>
                          ) : (
                            <>
                              <PaperAirplaneIcon className="w-3 h-3 mr-1" />
                              Resend
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleCancel(invitation._id)}
                          disabled={actionLoading[invitation._id]}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          {actionLoading[invitation._id] === 'cancelling' ? (
                            <>
                              <div className="animate-spin w-3 h-3 border border-red-700 border-t-transparent rounded-full mr-1"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XMarkIcon className="w-3 h-3 mr-1" />
                              Cancel
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Invitations (Accepted/Rejected/Expired) */}
          {otherInvitations.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">
                History ({otherInvitations.length})
              </h4>
              <div className="space-y-3">
                {otherInvitations.map((invitation) => (
                  <div key={invitation._id} className="border border-gray-200 rounded-lg p-4 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {invitation.invitedUser?.name || invitation.email}
                          </span>
                          <span className={getStatusBadge(invitation.status)}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {invitation.status === 'accepted' && invitation.acceptedAt && 
                            `Accepted on ${new Date(invitation.acceptedAt).toLocaleDateString()}`}
                          {invitation.status === 'rejected' && invitation.rejectedAt && 
                            `Rejected on ${new Date(invitation.rejectedAt).toLocaleDateString()}`}
                          {invitation.status === 'expired' && 
                            `Expired on ${new Date(invitation.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
