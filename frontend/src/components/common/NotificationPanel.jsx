import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';

export default function NotificationPanel({ notifications }) {
  const [notificationList, setNotificationList] = useState(notifications || []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotificationList(
        notificationList.map(notif =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotificationList(
        notificationList.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!notificationList || notificationList.length === 0) {
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
          onClick={markAllAsRead}
          className="text-sm text-primary-600 hover:text-primary-500"
        >
          Mark all as read
        </button>
      </div>
      <ul className="divide-y divide-gray-200">
        {notificationList.map((notification) => (
          <li key={notification._id} className={`py-4 ${!notification.read ? 'bg-blue-50' : ''}`}>
            <div className="flex space-x-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{notification.type.replace(/_/g, ' ')}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{notification.content}</p>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="text-xs text-primary-600 hover:text-primary-500"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <Link to="/notifications" className="text-sm text-primary-600 hover:text-primary-500">
          View all notifications
        </Link>
      </div>
    </div>
  );
}
