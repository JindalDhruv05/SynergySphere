// src/pages/Chats.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export default function Chats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);
  const [chatType, setChatType] = useState('personal');
  const [chatName, setChatName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isConnected && socket) {
      // Listen for new messages to update chat list
      socket.on('new_message', handleNewMessageInList);

      // Join all chats rooms to receive updates
      chats.forEach(chat => {
        socket.emit('join_chat', chat._id);
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [isConnected, socket, chats]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chats');
      setChats(response.data);
      
      // Calculate unread counts
      const counts = {};
      response.data.forEach(chat => {
        if (chat.lastMessage && !chat.lastMessage.readBy?.includes(user?.id)) {
          counts[chat._id] = (counts[chat._id] || 0) + 1;
        }
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/available');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleNewMessageInList = (message) => {
    // Update the chat list with the new message timestamp
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat._id === message.chatId) {
          return {
            ...chat,
            updatedAt: message.createdAt,
            lastMessage: message
          };
        }
        return chat;
      });
      
      // Sort chats by most recent message
      return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });

    // Update unread count if message is not from current user
    if (message.senderId._id !== user?.id) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.chatId]: (prev[message.chatId] || 0) + 1
      }));
    }
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (chatType === 'personal' && selectedMembers.length === 0) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const payload = {
        type: chatType,
        name: chatName || (chatType === 'personal' ? 'New Chat' : ''),
        memberIds: selectedMembers
      };
      console.log('Creating chat with payload:', payload);
      
      const response = await api.post('/chats', payload);
      console.log('Chat created:', response.data);
      setChats([response.data, ...chats]);
      // Navigate into the new chat detail
      navigate(`/chats/${response.data._id}`);
      
      // Reset form
      setChatType('personal');
      setChatName('');
      setSelectedMembers([]);
      setIsCreateChatModalOpen(false);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    !searchQuery || chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Chats
            {!isConnected && (
              <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Offline
              </span>
            )}
            {isConnected && (
              <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Communicate with your team</p>
        </div>
        <Button
          onClick={() => setIsCreateChatModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          New Chat
        </Button>
      </div>

      {/* Rest of your existing JSX remains the same */}
      <div className="mb-6">
        <label htmlFor="search" className="sr-only">Search chats</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            id="search"
            name="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search chats"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No chats found</p>
          <Button
            onClick={() => setIsCreateChatModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Start a new conversation
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <li key={chat._id}>
                <Link to={`/chats/${chat._id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 relative">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            chat.type === 'project' ? 'bg-blue-100' : 
                            chat.type === 'task' ? 'bg-green-100' : 
                            'bg-purple-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              chat.type === 'project' ? 'text-blue-800' : 
                              chat.type === 'task' ? 'text-green-800' : 
                              'text-purple-800'
                            }`}>
                              {chat.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {unreadCounts[chat._id] > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                              {unreadCounts[chat._id]}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{chat.name}</div>
                          <div className="text-xs text-gray-500">
                            {chat.type.charAt(0).toUpperCase() + chat.type.slice(1)} chat
                            {chat.lastMessage && (
                              <span className="ml-2">
                                • {chat.lastMessage.content.length > 30 
                                  ? chat.lastMessage.content.substring(0, 30) + '...' 
                                  : chat.lastMessage.content}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {format(new Date(chat.updatedAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Your existing Create Chat Modal remains the same */}
      <Modal isOpen={isCreateChatModalOpen} onClose={() => setIsCreateChatModalOpen(false)} title="Create New Chat" maxWidth="lg">
        <form onSubmit={handleCreateChat} className="space-y-4">
          <div>
            <label className="mr-4">
              <input
                type="radio"
                value="personal"
                checked={chatType === 'personal'}
                onChange={() => setChatType('personal')}
                className="mr-2"
              />
              Personal Chat
            </label>
            <label>
              <input
                type="radio"
                value="group"
                checked={chatType === 'group'}
                onChange={() => setChatType('group')}
                className="mr-2"
              />
              Group Chat
            </label>
          </div>

          {chatType === 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Chat Name</label>
              <input
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 p-2 rounded">
              {users.map(u => (
                <label key={u._id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={u._id}
                    checked={selectedMembers.includes(u._id)}
                    onChange={() => toggleMemberSelection(u._id)}
                    className="mr-2"
                  />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="text-right">
            <Button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting || (chatType === 'personal' && selectedMembers.length === 0)}
            >
              {submitting ? 'Creating...' : 'Create Chat'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
