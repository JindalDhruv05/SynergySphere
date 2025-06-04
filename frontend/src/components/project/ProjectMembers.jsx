import { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function ProjectMembers({ projectId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}/members`);
      setMembers(response.data);
    } catch (err) {
      setError('Failed to load project members');
      console.error('Error fetching project members:', err);
    } finally {
      setLoading(false);
    }
  };
  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users/available');
      // Filter out users who are already members
      const memberIds = members.map(member => member.userId._id);
      const availableUsers = response.data.filter(user => !memberIds.includes(user._id));
      setAvailableUsers(availableUsers);
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  const handleOpenAddMemberModal = () => {
    fetchAvailableUsers();
    setIsAddMemberModalOpen(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      setSubmitting(true);
      await api.post(`/projects/${projectId}/members`, {
        userId: selectedUserId,
        role: selectedRole
      });
      
      // Refresh member list
      fetchMembers();
      setIsAddMemberModalOpen(false);
      setSelectedUserId('');
      setSelectedRole('member');
    } catch (err) {
      setError('Failed to add member');
      console.error('Error adding project member:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      setMembers(members.filter(member => member.userId._id !== userId));
    } catch (err) {
      setError('Failed to remove member');
      console.error('Error removing project member:', err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/projects/${projectId}/members/${userId}`, { role: newRole });
      setMembers(members.map(member => 
        member.userId._id === userId ? { ...member, role: newRole } : member
      ));
    } catch (err) {
      setError('Failed to update member role');
      console.error('Error updating member role:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Project Members</h2>
        <Button
          onClick={handleOpenAddMemberModal}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Member
        </Button>
      </div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {members.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No members in this project yet.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {members.map((member) => (
              <li key={member._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {member.userId.avatar ? (
                      <img 
                        className="h-10 w-10 rounded-full" 
                        src={member.userId.avatar} 
                        alt={member.userId.name} 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-800 font-medium">
                          {member.userId.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.userId.name}</div>
                      <div className="text-sm text-gray-500">{member.userId.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <select
                      className="mr-4 block pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId._id, e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type='button'
                      onClick={() => handleRemoveMember(member.userId._id)}
                      className="text-red-600 hover:text-red-900">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} title="Add Project Member" maxWidth="lg">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700">
              User
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
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
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
              onClick={() => setIsAddMemberModalOpen(false)}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
