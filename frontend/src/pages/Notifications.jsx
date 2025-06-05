import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

// Helper function to safely format dates
const safeFormatDate = (dateString) => {
  if (!dateString) return new Date(); // Return current date as fallback
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date();
    return date;
  } catch (error) {
    console.warn('Invalid date for notification:', dateString);
    return new Date();
  }
};

const NOTIFICATION_TYPES = {
  task_assigned: { label: 'Task Assigned', icon: ClockIcon, color: 'text-blue-500' },
  task_updated: { label: 'Task Updated', icon: ClockIcon, color: 'text-blue-600' },
  task_completed: { label: 'Task Completed', icon: CheckIcon, color: 'text-green-500' },
  comment_added: { label: 'New Comment', icon: ChatBubbleLeftRightIcon, color: 'text-green-500' },
  deadline_approaching: { label: 'Deadline Alert', icon: ExclamationTriangleIcon, color: 'text-red-500' },
  project_invitation: { label: 'Project Invitation', icon: UserGroupIcon, color: 'text-purple-500' },
  project_invitation_accepted: { label: 'Invitation Accepted', icon: CheckIcon, color: 'text-green-600' },
  project_invitation_rejected: { label: 'Invitation Declined', icon: ExclamationTriangleIcon, color: 'text-red-400' },
  project_member_added: { label: 'New Member', icon: UserGroupIcon, color: 'text-purple-600' },
  document_shared: { label: 'Document Shared', icon: DocumentTextIcon, color: 'text-indigo-500' },
  budget_threshold: { label: 'Budget Alert', icon: CurrencyDollarIcon, color: 'text-yellow-500' },
  expense_approved: { label: 'Expense Approved', icon: CheckIcon, color: 'text-green-500' },
  expense_rejected: { label: 'Expense Rejected', icon: ExclamationTriangleIcon, color: 'text-red-500' },
  chat_ping: { label: 'Chat Message', icon: ChatBubbleLeftRightIcon, color: 'text-green-600' }
};

const Notifications = () => {
  const { notifications, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  }).sort((a, b) => safeFormatDate(b.createdAt) - safeFormatDate(a.createdAt));

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredNotifications.map(n => n._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectNotification = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkMarkAsRead = () => {
    selectedIds.forEach(id => markAsRead(id));
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm('Are you sure you want to delete selected notifications?')) {
      selectedIds.forEach(id => deleteNotification(id));
      setSelectedIds([]);
    }
  };

  const getNotificationIcon = (type) => {
    const notificationType = NOTIFICATION_TYPES[type];
    return notificationType ? notificationType.icon : BellIcon;
  };

  const getNotificationColor = (type) => {
    const notificationType = NOTIFICATION_TYPES[type];
    return notificationType ? notificationType.color : 'text-gray-500';
  };

  const getNotificationLabel = (type) => {
    const notificationType = NOTIFICATION_TYPES[type];
    return notificationType ? notificationType.label : 'Notification';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter === 'unread' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter === 'read' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Mark Read ({selectedIds.length})</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredNotifications.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="mr-2 rounded"
                />
                Select all visible notifications
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 
                 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const isSelected = selectedIds.includes(notification._id);
              
              return (
                <div
                  key={notification._id}
                  className={`bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow ${
                    !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectNotification(notification._id, e.target.checked)}
                      className="mt-1 rounded"
                    />
                    
                    <div className={`p-2 rounded-lg ${!notification.read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`w-5 h-5 ${getNotificationColor(notification.type)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            !notification.read ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getNotificationLabel(notification.type)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(safeFormatDate(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-medium text-gray-900 mt-1">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      
                      <div className="flex items-center space-x-3 mt-3">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
