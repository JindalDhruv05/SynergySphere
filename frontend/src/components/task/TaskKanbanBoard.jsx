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

  if (loading) return <div>Loading...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">
        {STATUS_COLUMNS.map(col => (
          <Droppable droppableId={col.id} key={col.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-gray-100 rounded-lg p-4 flex-1 min-h-[400px]"
              >
                <h2 className="font-bold mb-2">{col.title}</h2>
                {grouped[col.id].map((task, idx) => (
                  <Draggable draggableId={task._id} index={idx} key={task._id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-white rounded shadow p-3 mb-3 cursor-pointer ${snapshot.isDragging ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => onTaskClick && onTaskClick(task)}
                      >
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-gray-500">{task.priority} | Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
