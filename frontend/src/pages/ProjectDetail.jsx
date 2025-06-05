import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import TaskList from '../components/task/TaskList';
import ProjectMembers from '../components/project/ProjectMembers';
import ProjectDocuments from '../components/project/ProjectDocuments';
import ProjectBudget from '../components/project/ProjectBudget';
import ProjectExpenses from '../components/project/ProjectExpenses';
import CreateTaskModal from '../components/task/CreateTaskModal';
import ChatDetail from './ChatDetail';
import api from '../services/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [projectChat, setProjectChat] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    // Reset chat data on project change
    setProjectChat(null);
  }, [id]);
  useEffect(() => {
    if (activeTab === 'chat') {
      const fetchChat = async () => {
        setChatLoading(true);
        try {
          console.log('Fetching project chat for project ID:', id);
          const res = await api.get(`/project-chats/project/${id}`);
          console.log('Project chat response:', res.data);
          setProjectChat(res.data);
        } catch (err) {
          console.error('Error fetching project chat:', err);
          console.error('Error response:', err.response?.data);
          setProjectChat(null);
        } finally {
          setChatLoading(false);
        }
      };
      fetchChat();
    }
  }, [activeTab, id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectRes = await api.get(`/projects/${id}`);
      setProject(projectRes.data);
      
      // Fetch project tasks
      const tasksRes = await api.get(`/tasks?projectId=${id}`);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      if (error.response?.status === 404) {
        navigate('/projects', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleTaskCreated = (newTask) => {
    setTasks([...tasks, newTask]);
    setIsCreateTaskModalOpen(false);
  };

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
              <button
                type='button'
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Add Task
              </button>
            </div>
            <TaskList tasks={tasks} />
          </div>
        );      case 'members':
        return <ProjectMembers projectId={id} />;
      case 'budget':
        return <ProjectBudget projectId={id} project={project} onUpdateProject={handleProjectUpdate} />;
      case 'expenses':
        return <ProjectExpenses projectId={id} />;
      case 'documents':
        return <ProjectDocuments projectId={id} />;
      case 'chat':
        if (chatLoading) {
          return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div></div>;
        }
        if (!projectChat || !projectChat.chatId) {
          return (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-gray-500 mb-4">Failed to load project chat</p>
                <button
                  onClick={() => {
                    // Retry fetching chat
                    const fetchChat = async () => {
                      setChatLoading(true);
                      try {
                        const res = await api.get(`/project-chats/project/${id}`);
                        setProjectChat(res.data);
                      } catch (err) {
                        console.error('Error retrying project chat:', err);
                        setProjectChat(null);
                      } finally {
                        setChatLoading(false);
                      }
                    };
                    fetchChat();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="h-[600px]">
            <ChatDetail chatId={projectChat.chatId._id} isEmbedded={true} />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {project.description || 'No description provided'}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created by</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.createdBy?.name || 'Unknown'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created on</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(project.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              type='button'
              className={`${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('tasks')}>
              Tasks
            </button>            <button
              type='button'
              className={`${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('members')}>
              Members
            </button>
            <button
              type='button'
              className={`${
                activeTab === 'budget'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('budget')}>
              Budget
            </button>
            <button
              type='button'
              className={`${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('expenses')}>
              Expenses
            </button>
            <button
              type='button'
              className={`${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('documents')}>
              Documents
            </button>
            <button
              type='button'
              className={`${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('chat')}>
              Chat
            </button>
          </nav>
        </div>
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={id}
        onTaskCreated={handleTaskCreated}
      />
    </DashboardLayout>
  );
}
