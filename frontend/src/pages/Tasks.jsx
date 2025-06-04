import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import TaskKanbanBoard from '../components/task/TaskKanbanBoard';
import api from '../services/api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    projectId: '',
    searchQuery: ''
  });
  
  const location = useLocation();

  // Fetch data when component mounts or when returning from task creation
  useEffect(() => {
    fetchData();
  }, [location.key]); // Re-fetch when location changes (returning from create task page)

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects first to ensure we have project data
      const projectsRes = await api.get('/projects');
      setProjects(projectsRes.data);
      
      // Fetch tasks
      const tasksRes = await api.get('/tasks');
      
      // Enhance tasks with project data if needed
      const enhancedTasks = tasksRes.data.map(task => {
        // If projectId is just an ID string, find the project object
        if (task.projectId && typeof task.projectId === 'string') {
          const project = projectsRes.data.find(p => p._id === task.projectId);
          return { ...task, projectId: project || { _id: task.projectId, name: 'Unknown Project' } };
        }
        return task;
      });
      
      setTasks(enhancedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    
    // Handle both populated and unpopulated projectId
    const matchesProject = !filters.projectId || 
      (task.projectId && 
        (task.projectId._id === filters.projectId || task.projectId === filters.projectId));
    
    const matchesSearch = !filters.searchQuery || 
      task.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filters.searchQuery.toLowerCase()));
    
    return matchesStatus && matchesPriority && matchesProject && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your tasks</p>
        </div>        <Link
          to="/tasks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Task
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="search"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Search tasks"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              id="priority"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              id="project"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filters.projectId}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No tasks found matching your criteria</p>
            <Link
              to="/tasks/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create a new task
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <TaskKanbanBoard
            projectId={filters.projectId}
            onTaskClick={(task) => window.location.href = `/tasks/${task._id}`}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
