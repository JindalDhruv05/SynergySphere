import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../services/api';
import ConfirmDoneModal from './ConfirmDoneModal';

const STATUS_COLUMNS = [
  { id: 'To-Do', title: 'To-Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'Done', title: 'Done' }
];

export default function TaskKanbanBoard({ 
  projectId, 
  statusFilter, 
  priorityFilter, 
  searchQuery, 
  tasks: propTasks, 
  onTaskClick 
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDoneModal, setConfirmDoneModal] = useState({ 
    isOpen: false, 
    taskId: null, 
    taskTitle: '', 
    newStatus: null,
    originalStatus: null 
  });

  useEffect(() => {
    if (propTasks) {
      // Use tasks passed from parent (with filters applied)
      setTasks(propTasks);
      setLoading(false);
    } else {
      // Fallback to fetching tasks (for backward compatibility)
      fetchTasks();
    }
  }, [projectId, statusFilter, priorityFilter, searchQuery, propTasks]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (statusFilter) params.append('status', statusFilter);
      
      const queryString = params.toString();
      const url = queryString ? `/tasks?${queryString}` : '/tasks';
      
      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    
    const taskId = draggableId;
    const newStatus = destination.droppableId;
    const originalStatus = source.droppableId;
    const task = tasks.find(t => t._id === taskId);
    
    // If trying to move to Done status, show confirmation
    if (newStatus === 'Done' && originalStatus !== 'Done') {
      setConfirmDoneModal({
        isOpen: true,
        taskId,
        taskTitle: task?.title || '',
        newStatus,
        originalStatus
      });
      return;
    }

    // Check if task is Done and confirmed, prevent moving
    if (originalStatus === 'Done' && task?.statusConfirmed) {
      // Show error message or revert
      alert('This task has been confirmed as Done and cannot be changed.');
      return;
    }
    
    // Optimistic update for non-Done moves
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
      if (err.response?.data?.statusLocked) {
        alert('This task has been confirmed as Done and cannot be changed.');
      }
      fetchTasks(); // revert on error
    }
  };

  const handleConfirmDone = async () => {
    const { taskId, newStatus } = confirmDoneModal;
    
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t._id === taskId ? { ...t, status: newStatus, statusConfirmed: true } : t
    ));
    
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus, confirmDone: true });
    } catch (err) {
      console.error('Error confirming task completion:', err);
      fetchTasks(); // revert on error
    }
    
    setConfirmDoneModal({ isOpen: false, taskId: null, taskTitle: '', newStatus: null, originalStatus: null });
  };

  const handleCancelConfirm = () => {
    setConfirmDoneModal({ isOpen: false, taskId: null, taskTitle: '', newStatus: null, originalStatus: null });
  };

  // Helper for priority badge colors
  const getBadgeClasses = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-800';
    if (priority === 'Medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Helper for sorting by priority
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };

  // Sort tasks in each column by priority (High > Medium > Low)
  const grouped = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks
      .filter(t => t.status === col.id)
      .sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
    return acc;
  }, {});

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
    </div>
  );
  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto mt-4 pb-4">
          {STATUS_COLUMNS.map(col => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col w-80 bg-gray-50 rounded-lg shadow flex-shrink-0"
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-blue-600 rounded-t-lg">
                    <h2 className="text-white font-semibold text-lg">{col.title} ({grouped[col.id].length})</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
                    {grouped[col.id].map((task, idx) => (
                      <Draggable draggableId={task._id} index={idx} key={task._id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition ${snapshot.isDragging ? 'ring-2 ring-blue-500' : 'hover:shadow-md'} ${task.status === 'Done' && task.statusConfirmed ? 'opacity-75' : ''}`}
                            onClick={() => onTaskClick && onTaskClick(task)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-800">{task.title}</span>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeClasses(task.priority)}`}>{task.priority}</span>
                                {task.status === 'Done' && task.statusConfirmed && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
               )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      
      <ConfirmDoneModal
        isOpen={confirmDoneModal.isOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmDone}
        taskTitle={confirmDoneModal.taskTitle}
      />
    </>
  );
}
