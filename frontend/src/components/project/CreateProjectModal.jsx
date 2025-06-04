import { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    
    setLoading(true);
    setError('');    try {
      const response = await api.post('/projects', formData);
      onProjectCreated(response.data);
      resetForm();
      onClose(); // Close the modal on success
    } catch (err) {
      console.error('Project creation error:', err);
      setError(err.response?.data?.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" maxWidth="lg">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Project Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.name}
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
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Describe your project..."
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="flex-1 sm:flex-none"
          >
            {loading ? 'Creating...' : 'Create Project'}
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
