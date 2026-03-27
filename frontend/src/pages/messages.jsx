import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { messageAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function MessagesPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const userEmail = searchParams.get('user');
    if (userEmail && !loading && conversations) {
      // Check if conversation exists
      const conv = conversations.find(c => 
        c.participants && c.participants.some(p => p && p.email === userEmail)
      );
      
      if (conv) {
        // Existing conversation found
        setSelectedConversation(conv);
        fetchMessages(conv.id);
      } else {
        // No conversation exists, create one
        createNewConversation(userEmail);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations, loading]);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getAllChats();
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async (otherUserEmail) => {
    try {
      const response = await messageAPI.createOrFetchChat({
        otherUserEmail: otherUserEmail,
      });
      
      // Add to conversations list
      const newConv = response.data;
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setMessages([]);
      toast.success('Chat opened! Start messaging.');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to open chat');
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await messageAPI.getChatById(chatId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await messageAPI.sendMessage(selectedConversation.id, {
        content: newMessage,
      });
      setNewMessage('');
      fetchMessages(selectedConversation.id); // Refresh messages
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p.email !== user?.email);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-8 lg:px-20 py-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight mb-8">Messages</h1>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-100 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 font-medium">Loading...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-400">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {other?.imageUrl ? (
                          <img src={other.imageUrl} className="w-full h-full object-cover" alt={other.name} />
                        ) : (
                          <span className="text-sm font-bold">{other?.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-black">{other?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{conversation.lastMessage}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {getOtherParticipant(selectedConversation)?.imageUrl ? (
                        <img src={getOtherParticipant(selectedConversation).imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-sm font-bold">{getOtherParticipant(selectedConversation)?.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black">{getOtherParticipant(selectedConversation)?.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {getOtherParticipant(selectedConversation)?.rollNo}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.fromEmail === user?.email;
                      return (
                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md px-4 py-3 rounded-2xl ${isOwn ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                            <p className="text-sm font-medium">{message.content}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`bg-black text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all ${!newMessage.trim() ? 'opacity-50' : ''}`}
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-400 font-medium">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MessagesPage;
