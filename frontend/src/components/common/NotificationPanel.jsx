import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';

// Helper function to safely format dates
const safeFormatDate = (dateString) => {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Just now';
    return format(date, 'MMM d, h:mm a');
  } catch (error) {
    console.warn('Invalid date for notification:', dateString);
    return 'Just now';
  }
};

export default function NotificationPanel() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No notifications.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Recent Notifications</h3>
        <button
          type='button'
          onClick={markAllAsRead}
          className="text-sm text-blue-600 hover:text-blue-500">
          Mark all as read
        </button>
      </div>
      <ul className="divide-y divide-gray-200">
        {notifications.map((notification) => (
          <li key={notification._id} className={`py-4 ${!notification.read ? 'bg-blue-50' : ''}`}>
            <div className="flex space-x-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{notification.type.replace(/_/g, ' ')}</h3>                  <p className="text-sm text-gray-500">
                    {safeFormatDate(notification.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{notification.content}</p>
                {!notification.read && (
                  <button
                    type='button'
                    onClick={() => markAsRead(notification._id)}
                    className="text-xs text-blue-600 hover:text-blue-500">
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <Link to="/notifications" className="text-sm text-blue-600 hover:text-blue-500">
          View all notifications
        </Link>
      </div>
    </div>
  );
}
