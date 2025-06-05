import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProjectCard from '../components/project/ProjectCard';
import TaskKanbanBoard from '../components/task/TaskKanbanBoard';
import NotificationPanel from '../components/common/NotificationPanel';
import UserInvitations from '../components/invitations/UserInvitations';
import CreateTaskModal from '../components/task/CreateTaskModal';
import api from '../services/api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects only
        const projectsRes = await api.get('/projects');
        setProjects(projectsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTaskCreated = (newTask) => {
    setIsTaskModalOpen(false);
  };  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome to SynergySphere</p>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Task Board full-width */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Task Board</h2>
              <Link to="/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View all tasks
              </Link>
            </div>
            <TaskKanbanBoard
              projectId=""
              onTaskClick={(task) => navigate(`/tasks/${task._id}`)}
            />
          </section>          {/* Projects, Invitations, Quick Actions, Notifications below */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Projects</h2>
                <Link to="/projects/new" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Create new project
                </Link>
              </div>
              
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You don't have any projects yet.</p>
                  <Link to="/projects/new" className="text-blue-600 hover:underline mt-2 inline-block">
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
                  <Link to="/projects" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View all projects
                  </Link>
                </div>
              )}
            </section>

            {/* User Invitations */}
            <UserInvitations />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  type='button'
                  onClick={() => setIsTaskModalOpen(true)}
                  className="block w-full text-left px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Create new task
                </button>
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
            
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
              <NotificationPanel notifications={notifications} />
            </section>
          </div>
        </div>
      )}
      {/* Task Creation Modal */}
      <CreateTaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        projects={projects}
      />
    </DashboardLayout>
  );
}
