import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import ChatDetail from './ChatDetail';
import AddTaskMemberModal from '../components/task/AddTaskMemberModal';
import ConfirmDoneModal from '../components/task/ConfirmDoneModal';
import CreateSubtaskModal from '../components/task/CreateSubtaskModal';
import TaskExpenses from '../components/task/TaskExpenses';
import TaskBudget from '../components/task/TaskBudget';
import { format } from 'date-fns';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({});  const [submitting, setSubmitting] = useState(false);  const [taskChat, setTaskChat] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const [confirmDoneModal, setConfirmDoneModal] = useState({ 
    isOpen: false, 
    newStatus: null 
  });

  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);

  useEffect(() => {
    fetchTaskData();
    setTaskChat(null);
  }, [id]);
  useEffect(() => {
    if (activeTab === 'chat') {
      const fetchChat = async () => {
        setChatLoading(true);
        try {
          console.log('Fetching task chat for task ID:', id);
          const res = await api.get(`/task-chats/task/${id}`);
          console.log('Task chat response:', res.data);
          setTaskChat(res.data);
        } catch (err) {
          console.error('Error fetching task chat:', err);
          console.error('Error response:', err.response?.data);
          setTaskChat(null);
        } finally {
          setChatLoading(false);
        }
      };
      fetchChat();
    }
  }, [activeTab, id]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      
      // Fetch task details
      const taskRes = await api.get(`/tasks/${id}`);
      setTask(taskRes.data);
      setEditedTask(taskRes.data);
      
      // Fetch subtasks
      const subtasksRes = await api.get(`/tasks/${id}/subtasks`);
      setSubtasks(subtasksRes.data);
      
      // Fetch comments
      const commentsRes = await api.get(`/tasks/${id}/comments`);
      setComments(commentsRes.data);
      
      // Fetch members
      const membersRes = await api.get(`/tasks/${id}/members`);
      setMembers(membersRes.data);
      
      // Fetch documents
      const documentsRes = await api.get(`/task-documents/task/${id}/documents`);
      setDocuments(documentsRes.data);
    } catch (error) {
      console.error('Error fetching task data:', error);
      if (error.response?.status === 404) {
        navigate('/tasks', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleStatusChange = async (newStatus) => {
    // If trying to change to Done status and current status is not Done, show confirmation
    if (newStatus === 'Done' && task?.status !== 'Done') {
      setConfirmDoneModal({
        isOpen: true,
        newStatus
      });
      return;
    }

    // Check if task is Done and confirmed, prevent changes
    if (task?.status === 'Done' && task?.statusConfirmed && newStatus !== 'Done') {
      alert('This task has been confirmed as Done and cannot be changed.');
      return;
    }

    try {
      const response = await api.put(`/tasks/${id}`, { ...task, status: newStatus });
      setTask(response.data);
    } catch (error) {
      console.error('Error updating task status:', error);
      if (error.response?.data?.statusLocked) {
        alert('This task has been confirmed as Done and cannot be changed.');
      } else if (error.response?.data?.requiresConfirmation) {
        setConfirmDoneModal({
          isOpen: true,
          newStatus
        });
      }
    }
  };
  const handleConfirmDone = async () => {
    const { newStatus } = confirmDoneModal;
    
    try {
      let updateData;
      
      // If we're in editing mode, use the edited task data
      if (isEditing) {
        updateData = { 
          ...editedTask, 
          status: newStatus, 
          confirmDone: true 
        };
      } else {
        updateData = { 
          ...task, 
          status: newStatus, 
          confirmDone: true 
        };
      }
      
      const response = await api.put(`/tasks/${id}`, updateData);
      setTask(response.data);
      
      // If we were editing, exit edit mode
      if (isEditing) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error confirming task completion:', error);
    }
    
    setConfirmDoneModal({ isOpen: false, newStatus: null });
  };

  const handleCancelConfirm = () => {
    setConfirmDoneModal({ isOpen: false, newStatus: null });
  };
  const handleTaskUpdate = async () => {
    try {
      setSubmitting(true);
      
      // Check if status is changing to Done and requires confirmation
      if (editedTask.status === 'Done' && task?.status !== 'Done') {
        setConfirmDoneModal({
          isOpen: true,
          newStatus: 'Done'
        });
        setSubmitting(false);
        return;
      }

      // Check if trying to change from confirmed Done status
      if (task?.status === 'Done' && task?.statusConfirmed && editedTask.status !== 'Done') {
        alert('This task has been confirmed as Done and cannot be changed.');
        setEditedTask({ ...editedTask, status: 'Done' }); // Reset to Done
        setSubmitting(false);
        return;
      }
      
      const response = await api.put(`/tasks/${id}`, editedTask);
      setTask(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      if (error.response?.data?.statusLocked) {
        alert('This task has been confirmed as Done and cannot be changed.');
        setEditedTask({ ...editedTask, status: 'Done' }); // Reset to Done
      } else if (error.response?.data?.requiresConfirmation) {
        setConfirmDoneModal({
          isOpen: true,
          newStatus: editedTask.status
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      const response = await api.post(`/tasks/${id}/comments`, { content: newComment });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/${id}/comments/${commentId}`);
      setComments(comments.filter(comment => comment._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleMemberAdded = async (newMember) => {
    // Refresh the members list
    try {
      const membersRes = await api.get(`/tasks/${id}/members`);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Error refreshing members:', error);
    }
  };

  const handleRemoveTaskMember = async (userId) => {
    try {
      await api.delete(`/tasks/${id}/members/${userId}`);
      setMembers(members.filter(member => member.userId._id !== userId));
    } catch (error) {
      console.error('Error removing task member:', error);
    }
  };

  const handleUpdateTaskMemberRole = async (userId, newRole) => {
    try {
      await api.put(`/tasks/${id}/members/${userId}`, { role: newRole });
      setMembers(members.map(member => 
        member.userId._id === userId ? { ...member, role: newRole } : member
      ));
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  };

  const handleSubtaskCreated = async (newSubtask) => {
    // Refresh the subtasks list
    try {
      const subtasksRes = await api.get(`/tasks/${id}/subtasks`);
      setSubtasks(subtasksRes.data);
    } catch (error) {
      console.error('Error refreshing subtasks:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    id="title"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editedTask.title || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="status"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${task?.status === 'Done' && task?.statusConfirmed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      value={editedTask.status || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                      disabled={task?.status === 'Done' && task?.statusConfirmed}
                    >
                      <option value="To-Do">To-Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    {task?.status === 'Done' && task?.statusConfirmed && (
                      <div className="mt-1 text-xs text-green-600">
                        Status locked - Task confirmed as completed
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      id="priority"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={editedTask.priority || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
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
                    id="dueDate"
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={handleTaskUpdate}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{task?.title}</h2>
                    <p className="text-sm text-gray-500">
                      Project: {task?.projectId?.name || 'Unknown Project'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <div className="mt-2 prose prose-sm max-w-none text-gray-900">
                    {task?.description ? (
                      <p>{task.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-2">
                      <select
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${task?.status === 'Done' && task?.statusConfirmed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        value={task?.status || ''}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={task?.status === 'Done' && task?.statusConfirmed}
                      >
                        <option value="To-Do">To-Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                      {task?.status === 'Done' && task?.statusConfirmed && (
                        <div className="mt-1 flex items-center text-xs text-green-600">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Status locked - Task confirmed as completed
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task?.priority === 'High' ? 'bg-red-100 text-red-800' :
                        task?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task?.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <div className="mt-2 text-sm text-gray-900">
                      {task?.dueDate ? (
                        format(new Date(task.dueDate), 'MMM d, yyyy')
                      ) : (
                        <span className="text-gray-500 italic">No due date</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'subtasks':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Subtasks</h2>
              <button
                type="button"
                onClick={() => setIsAddSubtaskModalOpen(true)}
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Subtask
              </button>
            </div>
            
            {subtasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No subtasks yet</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {subtasks.map((subtask) => (
                  <li key={subtask._id} className="py-4">
                    <Link to={`/tasks/${subtask._id}`} className="block hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                            subtask.status === 'Done' ? 'bg-green-500' :
                            subtask.status === 'In Progress' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></span>
                          <p className="text-sm font-medium text-gray-900">{subtask.title}</p>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                            subtask.priority === 'High' ? 'bg-red-100 text-red-800' :
                            subtask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {subtask.priority}
                          </span>
                          {subtask.dueDate && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(subtask.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      case 'comments':
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>
            <form onSubmit={handleAddComment} className="mb-6">
              <div>
                <label htmlFor="comment" className="sr-only">Add a comment</label>
                <textarea
                  id="comment"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            ) : (
              <ul className="space-y-6">
                {comments.map((comment) => (
                  <li key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {comment.author.avatar ? (
                            <img className="h-10 w-10 rounded-full" src={comment.author.avatar} alt={comment.author.name} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-800 font-medium">
                                {comment.author.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{comment.author.name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-400 hover:text-gray-600">
                        <span className="sr-only">Delete comment</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{comment.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
        case 'members':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Assigned Members</h2>
              <button
                type='button'
                onClick={() => setIsAddMemberModalOpen(true)}
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Add Member
              </button>
            </div>
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No members assigned</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {members.map((member) => (
                  <li key={member._id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      {member.userId.avatar ? (
                        <img className="h-10 w-10 rounded-full" src={member.userId.avatar} alt={member.userId.name} />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-800 font-medium">
                            {member.userId.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{member.userId.name}</p>
                        <p className="text-xs text-gray-500">{member.userId.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <select
                        className="mr-4 block pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={member.role}
                        onChange={(e) => handleUpdateTaskMemberRole(member.userId._id, e.target.value)}
                      >
                        <option value="responsible">Responsible</option>
                        <option value="accountable">Accountable</option>
                        <option value="consulted">Consulted</option>
                        <option value="informed">Informed</option>
                      </select>
                      <button
                        type='button'
                        onClick={() => handleRemoveTaskMember(member.userId._id)}
                        className="text-red-600 hover:text-red-900 text-sm">
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      case 'documents':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
              <button
                type='button'
                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Upload Document
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No documents attached</p>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((document) => (
                  <li key={document._id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 truncate">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{document.name}</h3>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 truncate">
                            {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="-mt-px flex divide-x divide-gray-200">
                        <div className="w-0 flex-1 flex">
                          <a
                            href={document.googleDriveWebViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
                          >
                            <span>View</span>
                          </a>
                        </div>
                        <div className="-ml-px w-0 flex-1 flex">
                          <a
                            href={document.googleDriveWebContentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500"
                          >
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}          </div>
        );        case 'expenses':
        return (
          <div className="space-y-6">
            <TaskBudget 
              taskId={id} 
              task={task} 
              onUpdateTask={setTask} 
            />
            <TaskExpenses 
              taskId={id} 
              projectId={task?.projectId?._id} 
            />
          </div>
        );
        
        case 'chat':
        if (chatLoading) {
          return (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
          );
        }
          if (!taskChat) {
          return (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-gray-500 mb-4">Failed to load task chat</p>
                <button
                  onClick={() => {
                    // Trigger the useEffect to fetch/create the chat again
                    const fetchChat = async () => {
                      setChatLoading(true);
                      try {
                        console.log('Retrying task chat for task ID:', id);
                        const res = await api.get(`/task-chats/task/${id}`);
                        console.log('Task chat retry response:', res.data);
                        setTaskChat(res.data);
                      } catch (err) {
                        console.error('Error retrying task chat:', err);
                        setTaskChat(null);
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
        
        // Use populated chatId._id or fallback to chatId string
        const cid = typeof taskChat.chatId === 'object' ? taskChat.chatId._id : taskChat.chatId;
        return (
          <div className="h-[600px]">
            <ChatDetail chatId={cid} isEmbedded={true} />
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

  if (!task) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Task not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          &larr; Back to Tasks
        </Link>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              type='button'
              className={`${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('details')}>
              Details
            </button>
            <button
              type='button'
              className={`${
                activeTab === 'subtasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('subtasks')}>
              Subtasks
            </button>
            <button
              type='button'
              className={`${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('comments')}>
              Comments
            </button>
            <button
              type='button'
              className={`${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('members')}>
              Members
            </button>            <button
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
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('chat')}>
              Chat
            </button>
          </nav>
        </div>        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
        {/* Add Task Member Modal */}
      <AddTaskMemberModal 
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        taskId={id}
        onMemberAdded={handleMemberAdded}
        existingMembers={members}
      />
      
      {/* Confirm Done Modal */}
      <ConfirmDoneModal
        isOpen={confirmDoneModal.isOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmDone}
        taskTitle={task?.title || ''}
      />
      {/* Add Subtask Modal */}
      <CreateSubtaskModal
        isOpen={isAddSubtaskModalOpen}
        onClose={() => setIsAddSubtaskModalOpen(false)}
        parentTaskId={id}
        onSubtaskCreated={handleSubtaskCreated}
      />
    </DashboardLayout>
  );
}
