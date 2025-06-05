import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      console.log('🔄 Fetching notifications...');
      const data = await api.get('/notifications?read=false');
      console.log('✅ Notifications fetched:', data.data);
      setNotifications(data.data);
      setUnreadCount(data.data.length);
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
    }
  };
  const addNotification = (notif) => {
    console.log('🔔 New notification received:', notif);
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);  // Listen for server-pushed notifications
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not available for notifications');
      return;
    }
    console.log('🔌 Setting up notification listener');
    const handler = (notif) => {
      console.log('📨 Socket received notification:', notif);
      addNotification(notif);
    };
    socket.on('new_notification', handler);
    return () => { 
      console.log('🧹 Cleaning up notification listener');
      socket.off('new_notification', handler); 
    };
  }, [socket]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
