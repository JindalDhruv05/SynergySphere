import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project._id}`} className="block">
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
        
        {project.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
          </div>
          
          {project.members && (
            <div className="flex -space-x-1 overflow-hidden">
              {project.members.slice(0, 3).map((member) => (
                <img
                  key={member._id}
                  className="h-6 w-6 rounded-full ring-2 ring-white"
                  src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                  alt={member.name}
                />
              ))}
              {project.members.length > 3 && (
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-xs font-medium text-gray-500 ring-2 ring-white">
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
