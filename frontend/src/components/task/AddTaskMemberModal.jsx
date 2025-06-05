import { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function AddTaskMemberModal({ isOpen, onClose, taskId, onMemberAdded, existingMembers = [] }) {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('responsible');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    }
  }, [isOpen, existingMembers]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users/available');
      // Filter out users who are already members
      const memberIds = existingMembers.map(member => member.userId._id);
      const availableUsers = response.data.filter(user => !memberIds.includes(user._id));
      setAvailableUsers(availableUsers);
    } catch (err) {
      console.error('Error fetching available users:', err);
      setError('Failed to load available users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      setSubmitting(true);
      setError('');
      
      const response = await api.post(`/tasks/${taskId}/members`, {
        userId: selectedUserId,
        role: selectedRole
      });
      
      // Call the callback to refresh the member list
      onMemberAdded(response.data);
      
      // Reset form and close modal
      setSelectedUserId('');
      setSelectedRole('responsible');
      onClose();
    } catch (err) {
      console.error('Error adding task member:', err);
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setSelectedRole('responsible');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Task Member" maxWidth="lg">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700">
            User *
          </label>
          <select
            id="user"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
          >
            <option value="">Select a user</option>
            {availableUsers.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {availableUsers.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              No available users to add. All project members may already be assigned to this task.
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="responsible">Responsible</option>
            <option value="accountable">Accountable</option>
            <option value="consulted">Consulted</option>
            <option value="informed">Informed</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Based on the RACI responsibility assignment matrix
          </p>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <Button
            type="submit"
            disabled={submitting || !selectedUserId}
            variant="primary"
            className="flex-1 sm:flex-none"
          >
            {submitting ? 'Adding...' : 'Add Member'}
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
      </form>
    </Modal>
  );
}
