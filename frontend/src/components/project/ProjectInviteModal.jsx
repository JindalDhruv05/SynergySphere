import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Button from '../common/Button';
import api from '../../services/api';
import { invitationApi } from '../../services/invitationApi';

const ProjectInviteModal = ({ isOpen, onClose, projectId, projectName }) => {
  const [message, setMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users/available');
      setAvailableUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const promises = selectedUsers.map(user =>
        invitationApi.sendInvitation(projectId, user._id, 'member', message)
      );

      await Promise.all(promises);

      setSuccess(`Successfully sent ${selectedUsers.length} invitation${selectedUsers.length > 1 ? 's' : ''}!`);
      setSelectedUsers([]);
      setMessage('');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error sending invitations:', err);
      setError(err.response?.data?.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setMessage('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Invite to ${projectName}`} maxWidth="2xl">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Users to Invite
          </label>
          
          {availableUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No available users to invite</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {availableUsers.map((user) => {
                const isSelected = selectedUsers.find(u => u._id === user._id);
                return (
                  <div
                    key={user._id}
                    className={`flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer ${
                      isSelected ? 'bg-indigo-50 border-indigo-200' : ''
                    }`}
                    onClick={() => handleUserToggle(user)}
                  >
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => handleUserToggle(user)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                          alt={user.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">
                Selected users ({selectedUsers.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user._id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {user.name}
                    <button
                      type="button"
                      onClick={() => handleUserToggle(user)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-2 w-2" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Optional Message
          </label>
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to your invitation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
        <Button
          type="button"
          onClick={handleSendInvitations}
          disabled={loading || selectedUsers.length === 0}
          className="flex-1 sm:flex-none"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4 mr-2" />
              Send Invitation{selectedUsers.length > 1 ? 's' : ''} ({selectedUsers.length})
            </>
          )}
        </Button>
        
        <Button
          type="button"
          onClick={handleClose}
          variant="secondary"
          className="flex-1 sm:flex-none"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default ProjectInviteModal;
