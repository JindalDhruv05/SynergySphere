import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../services/api';

const STATUS_COLUMNS = [
  { id: 'To-Do', title: 'To-Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'Done', title: 'Done' }
];

export default function TaskKanbanBoard({ projectId, onTaskClick }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(res.data);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const taskId = draggableId;
    const newStatus = destination.droppableId;
    // Optimistic update
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      fetchTasks(); // revert on error
    }
  };

  const grouped = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  // Helper for priority badge colors
  const getBadgeClasses = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-800';
    if (priority === 'Medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
    </div>
  );

  return (
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
                          className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition ${snapshot.isDragging ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                          onClick={() => onTaskClick && onTaskClick(task)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800">{task.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeClasses(task.priority)}`}>{task.priority}</span>
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
  );
}
