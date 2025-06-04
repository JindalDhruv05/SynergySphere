import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import { format } from 'date-fns';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);
  const [chatType, setChatType] = useState('personal');
  const [chatName, setChatName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chats');
      setChats(response.data);
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
      
      const response = await api.post('/chats', payload);
      setChats([response.data, ...chats]);
      
      // Reset form
      setChatType('personal');
      setChatName('');
      setSelectedMembers([]);
      setIsCreateChatModalOpen(false);
    } catch (error) {
      console.error('Error creating chat:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Chats</h1>
          <p className="mt-1 text-sm text-gray-500">Communicate with your team</p>
        </div>
        <Button
          onClick={() => setIsCreateChatModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          New Chat
        </Button>
      </div>

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
                        <div className="flex-shrink-0">
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
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{chat.name}</div>
                          <div className="text-xs text-gray-500">
                            {chat.type.charAt(0).toUpperCase() + chat.type.slice(1)} chat
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
      )}      {/* Create Chat Modal */}
      <Modal isOpen={isCreateChatModalOpen} onClose={() => setIsCreateChatModalOpen(false)} title="Create New Chat" maxWidth="lg">
        <form onSubmit={handleCreateChat} className="space-y-4">
          <div>
            <label htmlFor="chat-type" className="block text-sm font-medium text-gray-700">
              Chat Type
            </label>
            <select
              id="chat-type"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={chatType}
              onChange={(e) => setChatType(e.target.value)}
            >
              <option value="personal">Personal</option>
              <option value="group">Group</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="chat-name" className="block text-sm font-medium text-gray-700">
              Chat Name {chatType === 'personal' && '(Optional)'}
            </label>
            <input
              type="text"
              id="chat-name"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter chat name"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              required={chatType !== 'personal'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Members
            </label>
            <div className="mt-1">
              <input
                type="text"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <li key={user._id} className="py-2">
                    <div className="flex items-center">
                      <input
                        id={`user-${user._id}`}
                        name={`user-${user._id}`}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedMembers.includes(user._id)}
                        onChange={() => toggleMemberSelection(user._id)}
                      />
                      <label htmlFor={`user-${user._id}`} className="ml-3 block text-sm font-medium text-gray-700">
                        {user.name} ({user.email})
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {selectedMembers.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
            <Button
              type="submit"
              disabled={submitting || (chatType === 'personal' && selectedMembers.length === 0)}
              variant="primary"
              className="flex-1 sm:flex-none"
            >
              {submitting ? 'Creating...' : 'Create'}
            </Button>
            <Button
              type="button"
              onClick={() => setIsCreateChatModalOpen(false)}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
