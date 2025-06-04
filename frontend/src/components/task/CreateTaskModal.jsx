import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function CreateTaskModal({ isOpen, onClose, projectId, onTaskCreated, projects = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To-Do',
    priority: 'Medium',
    dueDate: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
    projectId: projectId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Update projectId in form data when projectId prop changes
    if (projectId) {
      setFormData(prev => ({ ...prev, projectId }));
    }
  }, [projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    if (!formData.projectId) {
      setError('Project is required');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/tasks', formData);
      onTaskCreated(response.data);
      resetForm();
      onClose(); // Make sure to close the modal on success
    } catch (err) {
      console.error('Task creation error:', err);
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'To-Do',
      priority: 'Medium',
      dueDate: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
      projectId: projectId || ''
    });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" maxWidth="lg">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        
        {!projectId && projects.length > 0 && (
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
              Project *
            </label>
            <select
              id="projectId"
              name="projectId"
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={formData.projectId}
              onChange={handleChange}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
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
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
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
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
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
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="flex-1 sm:flex-none"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
          <Button
            type="button"
            onClick={onClose}
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
