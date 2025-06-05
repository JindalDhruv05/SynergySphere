import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { invitationApi } from '../../services/invitationApi';

export default function UserInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await invitationApi.getUserInvitations('pending');
      setInvitations(data);
    } catch (err) {
      setError('Failed to load invitations');
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'accepting' }));
      await invitationApi.acceptInvitation(invitationId);
      
      // Remove accepted invitation from the list
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      // You might want to show a success message or redirect
      alert('Invitation accepted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  const handleReject = async (invitationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [invitationId]: 'rejecting' }));
      await invitationApi.rejectInvitation(invitationId);
      
      // Remove rejected invitation from the list
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      alert('Invitation rejected');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setActionLoading(prev => ({ ...prev, [invitationId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
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

  if (invitations.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Invitations</h3>
        <p className="text-gray-500">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Project Invitations ({invitations.length})
      </h3>
      
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {invitation.projectId?.name || 'Unknown Project'}
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Pending
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  Invited by: <span className="font-medium">{invitation.invitedBy?.name}</span>
                </p>
                
                {invitation.projectId?.description && (
                  <p className="text-sm text-gray-500 mb-2">
                    {invitation.projectId.description}
                  </p>
                )}
                
                {invitation.message && (
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-3">
                    <span className="font-medium">Message: </span>
                    {invitation.message}
                  </div>
                )}
                
                <p className="text-xs text-gray-400">
                  Role: {invitation.role} • 
                  Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <Button
                  onClick={() => handleAccept(invitation._id)}
                  disabled={actionLoading[invitation._id]}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading[invitation._id] === 'accepting' ? (
                    <>
                      <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-1"></div>
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-3 h-3 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => handleReject(invitation._id)}
                  disabled={actionLoading[invitation._id]}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  {actionLoading[invitation._id] === 'rejecting' ? (
                    <>
                      <div className="animate-spin w-3 h-3 border border-red-700 border-t-transparent rounded-full mr-1"></div>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XMarkIcon className="w-3 h-3 mr-1" />
                      Reject
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
