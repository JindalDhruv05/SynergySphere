import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FolderIcon } from '@heroicons/react/24/solid';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project._id}`} className="block group">
      <div className="relative border border-indigo-200 bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mr-3">
            <FolderIcon className="h-7 w-7 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-indigo-900 truncate group-hover:text-indigo-700 transition-colors duration-200">{project.name}</h3>
        </div>
        
        {project.description && (
          <p className="mb-4 text-sm text-gray-600 line-clamp-3 flex-1">{project.description}</p>
        )}
        
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
