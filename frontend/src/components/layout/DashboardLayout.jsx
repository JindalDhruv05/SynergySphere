import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  HomeIcon, 
  FolderIcon, 
  ClipboardDocumentListIcon, 
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  BellIcon,
  ChartBarIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Helper function to safely format dates
const formatNotificationDate = (dateString) => {
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

export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, fetchNotifications } = useNotifications();
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileDropdownOpen &&
        !event.target.closest('#user-menu-button') &&
        !event.target.closest('#user-menu-dropdown')
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        notificationDropdownOpen &&
        !event.target.closest('#notification-button') &&
        !event.target.closest('#notification-dropdown')
      ) {
        setNotificationDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen, notificationDropdownOpen]);
  // Close dropdown when navigating
  useEffect(() => {
    setProfileDropdownOpen(false);
    setNotificationDropdownOpen(false);  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Chats', href: '/chats', icon: ChatBubbleLeftRightIcon },
    { name: 'Documents', href: '/documents', icon: DocumentIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
  ];

  // Determine if a nav item is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Get page title from props or derive from current path
  const pageTitle = title || navigation.find(item => isActive(item.href))?.name || 'Dashboard';
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" 
          aria-hidden="true" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-full max-w-xs transform bg-white dark:bg-gray-800 transition duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>        <div className="h-full flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">SynergySphere</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map((item) => (              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon 
                  className={`mr-4 h-6 w-6 ${
                    isActive(item.href) 
                      ? 'text-blue-500 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }`} 
                  aria-hidden="true" 
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto transition-colors duration-200">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">SynergySphere</span>
          </div>
          <div className="flex-grow flex flex-col">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon 
                    className={`mr-3 h-6 w-6 ${
                      isActive(item.href) 
                        ? 'text-blue-500' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                    aria-hidden="true" 
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
            </div><div className="ml-4 flex items-center md:ml-6">
              {/* Notifications dropdown */}
              <div className="relative">                <button 
                  type="button"
                  id="notification-button"
                  className="relative p-1 rounded-full text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>                {/* Notification dropdown */}
                {notificationDropdownOpen && (
                  <div 
                    id="notification-dropdown"
                    className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 focus:outline-none z-50"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="py-1 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                      </div>
                      {notifications && notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (                          <div
                            key={notification._id}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.type.replace(/_/g, ' ')}
                                </p>                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {notification.content}
                                </p>                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {formatNotificationDate(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.read && (
                                <button
                                  type="button"
                                  onClick={() => markAsRead(notification._id)}
                                  className="ml-2 text-xs text-blue-600 hover:text-blue-500"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (                        <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                          No notifications yet
                        </div>
                      )}                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          to="/notifications"
                          className="text-sm text-blue-600 hover:text-blue-500"
                          onClick={() => setNotificationDropdownOpen(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>                  <button
                    type="button"
                    className="max-w-xs bg-white dark:bg-gray-800 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    {user?.avatar ? (
                      <img className="h-8 w-8 rounded-full" src={user.avatar} alt={user.name} />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                    )}
                    <span className="ml-2 text-gray-700 dark:text-gray-300 hidden md:block">{user?.name}</span>
                  </button>
                </div>
                  {/* Dropdown menu */}
                {profileDropdownOpen && (
                  <div id="user-menu-dropdown"
                     className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 focus:outline-none"
                     role="menu"
                     aria-orientation="vertical"
                     aria-labelledby="user-menu-button"
                     onMouseDown={(e) => e.stopPropagation()}
                   >                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Your Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Settings
                    </Link>
                    <button
                      type='button'
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
