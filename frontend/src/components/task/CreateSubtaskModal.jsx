import { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function CreateSubtaskModal({ isOpen, onClose, parentTaskId, onSubtaskCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To-Do',
    priority: 'Medium',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Subtask title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/tasks/${parentTaskId}/subtasks`, formData);
      onSubtaskCreated(response.data);
      setFormData({ title: '', description: '', status: 'To-Do', priority: 'Medium', dueDate: '' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subtask. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', status: 'To-Do', priority: 'Medium', dueDate: '' });
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Subtask" maxWidth="lg">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.title}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              name="status"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              id="priority"
              name="priority"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
          <input
            type="date"
            name="dueDate"
            id="dueDate"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <Button type="submit" disabled={loading} variant="primary" className="flex-1 sm:flex-none">
            {loading ? 'Creating...' : 'Create Subtask'}
          </Button>
          <Button type="button" onClick={handleClose} variant="secondary" className="flex-1 sm:flex-none">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
