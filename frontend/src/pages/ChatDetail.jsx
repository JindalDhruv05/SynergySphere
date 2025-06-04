// src/pages/ChatDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/common/Button';

export default function ChatDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, isConnected, joinChat, leaveChat, sendMessage, startTyping, stopTyping } = useSocket();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchChatData();
  }, [id]);
  useEffect(() => {
    if (isConnected && id && socket) {
      // Join the chat room
      joinChat(id);

      // Set up message listeners
      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
      socket.on('message_error', handleMessageError);

      return () => {
        // Clean up listeners
        socket.off('new_message');
        socket.off('messages_read');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
        socket.off('message_error');
        leaveChat(id);
      };
    }
  }, [isConnected, id, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      
      const [chatRes, messagesRes, membersRes] = await Promise.all([
        api.get(`/chats/${id}`),
        api.get(`/chats/${id}/messages`),
        api.get(`/chats/${id}/members`)
      ]);
      
      setChat(chatRes.data);
      setMessages(messagesRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prevMessages => {
      const exists = prevMessages.some(msg => msg._id === message._id);
      if (exists) return prevMessages;
      return [...prevMessages, message];
    });
  };

  const handleMessagesRead = ({ userId, messageIds }) => {
    if (userId !== user.id) {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          messageIds.includes(msg._id) 
            ? { ...msg, readBy: [...msg.readBy, userId] }
            : msg
        )
      );
    }
  };

  const handleUserTyping = ({ userId, userName, chatId }) => {
    if (userId !== user.id && chatId === id) {
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === userId)) {
          return [...prev, { userId, userName }];
        }
        return prev;
      });
    }
  };

  const handleUserStoppedTyping = ({ userId, chatId }) => {
    if (userId !== user.id && chatId === id) {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    }
  };

  const handleMessageError = (error) => {
    console.error('Message error:', error);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || submitting) return;
    
    try {
      setSubmitting(true);
      
      if (isConnected && socket) {
        // Real-time messaging via socket
        console.log('📡 Sending message via socket (real-time)');
        sendMessage(id, newMessage);
      } else {
        // Fallback to HTTP API (persistent messaging)
        console.log('📨 Sending message via HTTP API (persistent)');
        await api.post(`/chats/${id}/messages`, { content: newMessage });
        // Refresh messages to show the new message
        fetchChatData();
      }
      
      setNewMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      // If socket fails, try HTTP API as backup
      if (isConnected) {
        try {
          console.log('🔄 Socket failed, trying HTTP API backup');
          await api.post(`/chats/${id}/messages`, { content: newMessage });
          fetchChatData();
        } catch (httpError) {
          console.error('HTTP API backup also failed:', httpError);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
      if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      startTyping(id);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };
  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(id);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'h:mm a');
    }
    
    return format(messageDate, 'MMM d, h:mm a');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/chats" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          &larr; Back to Chats
        </Link>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg flex flex-col h-[calc(100vh-200px)]">
        {/* Chat header */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{chat?.name}</h2>
            <p className="text-sm text-gray-500">
              {chat?.type.charAt(0).toUpperCase() + chat?.type.slice(1)} chat • {members.length} members
              {!isConnected && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  Disconnected
                </span>
              )}
              {isConnected && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.senderId._id === user.id;
              const showAvatar = index === 0 || messages[index - 1].senderId._id !== message.senderId._id;
              
              return (
                <div key={message._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[75%]`}>
                    {showAvatar && !isCurrentUser && (
                      <div className="flex-shrink-0 mr-2">
                        {message.senderId.avatar ? (
                          <img className="h-8 w-8 rounded-full" src={message.senderId.avatar} alt={message.senderId.name} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-medium text-sm">
                              {message.senderId.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      {showAvatar && (
                        <div className={`text-xs text-gray-500 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                          {isCurrentUser ? 'You' : message.senderId.name}
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <div className={`px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {message.content}
                        </div>
                        
                        <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                          {formatMessageTime(message.createdAt)}
                          {isCurrentUser && (
                            <span className="ml-1">
                              • {message.readBy.length > 1 ? 'Read' : 'Sent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {showAvatar && isCurrentUser && (
                      <div className="flex-shrink-0 ml-2">
                        {user.avatar ? (
                          <img className="h-8 w-8 rounded-full" src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message input */}
        <div className="border-t border-gray-200 px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex">            <input
              type="text"
              className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                !isConnected ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
              placeholder={isConnected ? "Type your message..." : "Type your message (will be sent when reconnected)..."}
              value={newMessage}
              onChange={handleInputChange}
              onBlur={handleStopTyping}
            />
            <Button
              type="submit"
              className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
                isConnected 
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                  : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
              }`}
              disabled={!newMessage.trim() || submitting}
              title={isConnected ? "Send message" : "Send message (persistent mode)"}
            >
              {submitting ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 008-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
