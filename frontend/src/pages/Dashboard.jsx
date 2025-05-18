import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProjectCard from '../components/project/ProjectCard';
import TaskList from '../components/task/TaskList';
import NotificationPanel from '../components/common/NotificationPanel';
import api from '../services/api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects
        const projectsRes = await api.get('/projects');
        setProjects(projectsRes.data);
        
        // Fetch recent tasks
        const tasksRes = await api.get('/tasks?limit=5');
        setRecentTasks(tasksRes.data);
        
        // Fetch notifications
        const notificationsRes = await api.get('/notifications?limit=10');
        setNotifications(notificationsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to SynergySphere</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Projects</h2>
                <Link to="/projects/new" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  Create new project
                </Link>
              </div>
              
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You don't have any projects yet.</p>
                  <Link to="/projects/new" className="text-primary-600 hover:underline mt-2 inline-block">
                    Create your first project
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.slice(0, 4).map(project => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              )}
              
              {projects.length > 4 && (
                <div className="mt-4 text-center">
                  <Link to="/projects" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    View all projects
                  </Link>
                </div>
              )}
            </section>
            
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
                <Link to="/tasks" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  View all tasks
                </Link>
              </div>
              
              <TaskList tasks={recentTasks} />
            </section>
          </div>
          
          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
              <NotificationPanel notifications={notifications} />
            </section>
            
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link 
                  to="/tasks/new" 
                  className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create new task
                </Link>
                <Link 
                  to="/chats" 
                  className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View messages
                </Link>
                <Link 
                  to="/documents" 
                  className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Manage documents
                </Link>
              </div>
            </section>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
