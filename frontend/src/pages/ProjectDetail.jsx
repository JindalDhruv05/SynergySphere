import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import DashboardLayout from '../components/layout/DashboardLayout';
import TaskList from '../components/task/TaskList';
import ProjectMembers from '../components/project/ProjectMembers';
import ProjectDocuments from '../components/project/ProjectDocuments';
import ProjectBudget from '../components/project/ProjectBudget';
import ProjectExpenses from '../components/project/ProjectExpenses';
import CreateTaskModal from '../components/task/CreateTaskModal';
import ProjectInviteModal from '../components/project/ProjectInviteModal';
import ProjectInvitations from '../components/invitations/ProjectInvitations';
import ChatDetail from './ChatDetail';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinProject, leaveProject, onProjectCompletionUpdated, onProjectFullyCompleted } = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
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

  // Socket integration for real-time project completion updates
  useEffect(() => {
    if (id && joinProject && leaveProject) {
      // Join the project room for real-time updates
      joinProject(id);

      // Set up event listeners for real-time completion updates
      const unsubscribeCompletion = onProjectCompletionUpdated?.((data) => {
        if (data.projectId === id) {
          console.log('Received project completion update:', data);
          
          // Update the project completion data in real-time
          setProject(prevProject => {
            if (prevProject) {
              return {
                ...prevProject,
                completion: data.completion
              };
            }
            return prevProject;
          });

          // Show a toast notification about the update
          if (data.taskTitle && data.taskStatus) {
            console.log(`Task "${data.taskTitle}" status changed to ${data.taskStatus} by ${data.updatedBy.name}`);
          }
        }
      });

      const unsubscribeFullCompletion = onProjectFullyCompleted?.((data) => {
        if (data.projectId === id) {
          console.log('Project fully completed!', data);
          
          // Update project completion status
          setProject(prevProject => {
            if (prevProject) {
              return {
                ...prevProject,
                completion: data.completionStats
              };
            }
            return prevProject;
          });

          // Show congratulations message
          console.log(`🎉 Project "${data.projectName}" has been completed!`);
        }
      });

      // Cleanup function
      return () => {
        leaveProject(id);
        unsubscribeCompletion?.();
        unsubscribeFullCompletion?.();
      };
    }
  }, [id, joinProject, leaveProject, onProjectCompletionUpdated, onProjectFullyCompleted]);

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
      case 'invitations':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Invitations</h2>
              <button
                type='button'
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Invite Members
              </button>
            </div>
            <ProjectInvitations projectId={id} />
          </div>
        );      case 'budget':
        return <ProjectBudget projectId={id} project={project} onUpdateProject={handleProjectUpdate} />;
      case 'expenses':
        return <ProjectExpenses projectId={id} />;
      case 'documents':
        return <ProjectDocuments projectId={id} />;
      case 'completion':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Completion Overview</h2>
              
              {project.completion ? (
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <div className="text-center">
                    <div className="mb-4">
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
                        project.completion.isFullyCompleted ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {project.completion.isFullyCompleted ? (
                          <CheckCircleIcon className="w-12 h-12 text-green-500" />
                        ) : (
                          <span className={`text-2xl font-bold ${
                            project.completion.completionPercentage >= 75 ? 'text-blue-600' :
                            project.completion.completionPercentage >= 50 ? 'text-yellow-600' :
                            project.completion.completionPercentage >= 25 ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {Math.round(project.completion.completionPercentage)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.completion.isFullyCompleted ? 'Project Completed!' : 'In Progress'}
                    </h3>
                    <p className="text-gray-600">
                      {project.completion.completedTasks} of {project.completion.totalTasks} tasks completed
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{project.completion.completionPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          project.completion.completionPercentage === 100 ? 'bg-green-500' :
                          project.completion.completionPercentage >= 75 ? 'bg-blue-500' :
                          project.completion.completionPercentage >= 50 ? 'bg-yellow-500' :
                          project.completion.completionPercentage >= 25 ? 'bg-orange-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${project.completion.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-900">{project.completion.totalTasks}</div>
                      <div className="text-sm text-gray-600">Total Tasks</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{project.completion.completedTasks}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">{project.completion.totalTasks - project.completion.completedTasks}</div>
                      <div className="text-sm text-gray-600">Remaining</div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  {project.completion.allTasksCount !== project.completion.parentTasksCount && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Task Breakdown</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Parent Tasks:</span>
                          <span>{project.completion.parentTasksCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Tasks (including subtasks):</span>
                          <span>{project.completion.allTasksCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {project.completion.isFullyCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                        <div>
                          <h4 className="text-green-800 font-medium">Congratulations!</h4>
                          <p className="text-green-700 text-sm">All tasks in this project have been completed and confirmed.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completion data available</h3>
                  <p className="text-gray-500">Completion statistics will appear here once you add tasks to this project.</p>
                </div>
              )}
            </div>
          </div>
        );
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

  return (    <DashboardLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {project.description || 'No description provided'}
              </p>
            </div>
            {project.completion?.isFullyCompleted && (
              <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">Project Completed</span>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
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
            {project.completion && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Completion</dt>
                <dd className="mt-1">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          project.completion.completionPercentage === 100 ? 'bg-green-500' :
                          project.completion.completionPercentage >= 75 ? 'bg-blue-500' :
                          project.completion.completionPercentage >= 50 ? 'bg-yellow-500' :
                          project.completion.completionPercentage >= 25 ? 'bg-orange-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${project.completion.completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {project.completion.completionPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {project.completion.completedTasks} of {project.completion.totalTasks} tasks completed
                  </p>
                </dd>
              </div>
            )}
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
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('invitations')}>
              Invitations
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
            </button>            <button
              type='button'
              className={`${
                activeTab === 'completion'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('completion')}>
              Completion
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
      </div>      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={id}
        onTaskCreated={handleTaskCreated}
      />
      <ProjectInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={id}
      />
    </DashboardLayout>
  );
}
