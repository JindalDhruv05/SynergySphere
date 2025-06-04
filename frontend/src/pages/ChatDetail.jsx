import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';
import Button from '../components/common/Button';

export default function ChatDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    fetchChatData();
    
    // Set up socket connection
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('joinChat', id);
    });
    
    socketRef.current.on('newMessage', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });
    
    socketRef.current.on('messagesRead', ({ userId, messageIds }) => {
      if (userId !== user.id) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            messageIds.includes(msg._id) 
              ? { ...msg, readBy: [...msg.readBy, userId] }
              : msg
          )
        );
      }
    });
    
    return () => {
      // Clean up socket connection
      if (socketRef.current) {
        socketRef.current.emit('leaveChat', id);
        socketRef.current.disconnect();
      }
    };
  }, [id, user.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      
      // Fetch chat details
      const chatRes = await api.get(`/chats/${id}`);
      setChat(chatRes.data);
      
      // Fetch messages
      const messagesRes = await api.get(`/chats/${id}/messages`);
      setMessages(messagesRes.data);
      
      // Fetch members
      const membersRes = await api.get(`/chats/${id}/members`);
      setMembers(membersRes.data);
      
      // Mark messages as read
      const unreadMessages = messagesRes.data.filter(
        msg => !msg.readBy.includes(user.id)
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id);
        await api.patch(`/chats/${id}/messages/read`, { messageIds });
        
        // Notify other users that messages have been read
        socketRef.current.emit('markAsRead', {
          chatId: id,
          userId: user.id,
          messageIds
        });
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      setSubmitting(true);
      const response = await api.post(`/chats/${id}/messages`, { content: newMessage });
      
      // No need to add the message here as it will come through the socket
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
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
            </p>
          </div>
          <Button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50">
            <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            Options
          </Button>
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
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message input */}
        <div className="border-t border-gray-200 px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              type="submit"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!newMessage.trim() || submitting}
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
