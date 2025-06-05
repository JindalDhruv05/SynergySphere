import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FolderIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function ProjectCard({ project: initialProject }) {
  const [project, setProject] = useState(initialProject);
  const { onProjectCompletionUpdated, onProjectFullyCompleted } = useSocket();

  // Update local project state when prop changes
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  // Listen for real-time project completion updates
  useEffect(() => {
    const unsubscribeCompletion = onProjectCompletionUpdated?.((data) => {
      if (data.projectId === project._id) {
        console.log('ProjectCard: Received completion update for project', project._id);
        
        // Update the project completion data
        setProject(prevProject => ({
          ...prevProject,
          completion: data.completion
        }));
      }
    });

    const unsubscribeFullCompletion = onProjectFullyCompleted?.((data) => {
      if (data.projectId === project._id) {
        console.log('ProjectCard: Project fully completed!', project._id);
        
        // Update project completion status
        setProject(prevProject => ({
          ...prevProject,
          completion: data.completionStats
        }));
      }
    });

    return () => {
      unsubscribeCompletion?.();
      unsubscribeFullCompletion?.();
    };
  }, [project._id, onProjectCompletionUpdated, onProjectFullyCompleted]);
  const completion = project.completion || {
    totalTasks: 0,
    completedTasks: 0,
    completionPercentage: 0,
    isFullyCompleted: false
  };

  const getCompletionColor = (percentage) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };  return (
    <Link to={`/projects/${project._id}`} className="block group">
      <div className="relative border border-indigo-200 bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mr-3">
            <FolderIcon className="h-7 w-7 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-indigo-900 truncate group-hover:text-indigo-700 transition-colors duration-200">{project.name}</h3>
          </div>
          {completion.isFullyCompleted && (
            <div className="flex-shrink-0 ml-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500" title="Project Completed" />
            </div>
          )}
        </div>
        
        {project.description && (
          <p className="mb-4 text-sm text-gray-600 line-clamp-3 flex-1">{project.description}</p>
        )}

        {/* Completion Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className={`text-sm font-bold ${getCompletionColor(completion.completionPercentage)}`}>
              {completion.completionPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(completion.completionPercentage)}`}
              style={{ width: `${completion.completionPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{completion.completedTasks} of {completion.totalTasks} tasks completed</span>
            {completion.isFullyCompleted && (
              <span className="text-green-600 font-medium">✓ Complete</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium mr-2">{project.status || 'Active'}</span>
            <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
          </div>
          
          {project.members && (
            <div className="flex -space-x-2 overflow-hidden">
              {project.members.slice(0, 3).map((member) => (
                <img
                  key={member._id}
                  className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                  src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                  alt={member.name}
                  title={member.name}
                />
              ))}
              
              {project.members.length > 3 && (
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 border-2 border-white shadow-sm">
                  +{project.members.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
