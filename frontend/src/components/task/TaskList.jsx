import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export default function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tasks found.</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'In Progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <li key={task._id}>
            <Link to={`/tasks/${task._id}`} className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(task.status)}
                    <p className="ml-2 text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Project: {task.projectId?.name || 'Unknown Project'}
                    </p>
                  </div>
                  {task.dueDate && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
