// context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && token) {
      // Create a new socket connection for each user session
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      setSocket(socketInstance);      socketInstance.on('connect', () => {
        console.log('✅ Socket connected successfully:', socketInstance.id, 'User:', user.name);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('❌ Socket disconnected', 'User:', user.name);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('🔴 Socket connection error:', error);
        setIsConnected(false);
      });

      return () => {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }    }
  }, [user, token]);

  // Socket utility methods
  const joinChat = (chatId) => {
    if (socket) {
      socket.emit('join_chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket) {
      socket.emit('leave_chat', chatId);
    }
  };

  const sendMessage = (chatId, content) => {
    if (socket) {
      socket.emit('send_message', { chatId, content });
    }
  };

  const markMessagesRead = (chatId, messageIds) => {
    if (socket) {
      socket.emit('mark_messages_read', { chatId, messageIds });
    }
  };

  const startTyping = (chatId) => {
    if (socket) {
      socket.emit('typing_start', { chatId });
    }
  };

  const stopTyping = (chatId) => {
    if (socket) {
      socket.emit('typing_stop', { chatId });
    }
  };

  const value = {
    socket,
    isConnected,
    // Utility methods
    joinChat,
    leaveChat,
    sendMessage,
    markMessagesRead,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
