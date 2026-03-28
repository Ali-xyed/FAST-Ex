import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { messageAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { initSocket, joinChat, onNewMessage, offNewMessage, disconnectSocket } from '../utils/socket';

function MessagesPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentChatIdRef = useRef(null);

  // Initialize socket connection on mount
  useEffect(() => {
    initSocket();
    fetchConversations();

    // Cleanup on unmount
    return () => {
      offNewMessage();
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for new messages via WebSocket
  useEffect(() => {
    onNewMessage((message) => {
      console.log('Received new message via socket:', message);
      
      // Only add message if it belongs to the currently selected chat
      if (currentChatIdRef.current === message.chatId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }

      // Update last message in conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.chatId
            ? { ...conv, lastMessage: message.content }
            : conv
        )
      );
    });

    return () => {
      offNewMessage();
    };
  }, []);

  useEffect(() => {
    const userEmail = searchParams.get('user');
    const chatId = searchParams.get('chat');
    
    if (chatId && !loading && conversations) {
      // Find conversation by chat ID
      const conv = conversations.find(c => c.id === chatId);
      if (conv) {
        setSelectedConversation(conv);
        currentChatIdRef.current = conv.id;
        fetchMessages(conv.id);
        joinChat(conv.id);
      }
    } else if (userEmail && !loading && conversations) {
      // Check if conversation exists
      const conv = conversations.find(c => 
        c.user1 === userEmail || c.user2 === userEmail
      );
      
      if (conv) {
        // Existing conversation found
        setSelectedConversation(conv);
        currentChatIdRef.current = conv.id;
        fetchMessages(conv.id);
        joinChat(conv.id);
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
        otherEmail: otherUserEmail,
      });
      
      // Add to conversations list
      const newConv = response.data;
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      currentChatIdRef.current = newConv.id;
      setMessages([]);
      joinChat(newConv.id);
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

    const messageContent = newMessage;
    setNewMessage(''); // Clear input immediately for better UX

    try {
      await messageAPI.sendMessage(selectedConversation.id, {
        content: messageContent,
      });
      // Message will be added via WebSocket event, no need to manually add
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    currentChatIdRef.current = conversation.id;
    fetchMessages(conversation.id);
    
    // Join the chat room via WebSocket
    joinChat(conversation.id);
  };

  // Poll for new messages when a chat is selected
  useEffect(() => {
    if (!selectedConversation) return;

    // Initial fetch
    fetchMessages(selectedConversation.id);

    // Poll every 2 seconds for new messages
    const pollInterval = setInterval(() => {
      if (currentChatIdRef.current) {
        fetchMessages(currentChatIdRef.current);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get current user's email from user object
  const getCurrentUserEmail = () => {
    // Try different possible field names
    return user?.email || user?.clerkId || user?.userEmail || localStorage.getItem('userEmail');
  };

  const getOtherParticipant = (conversation) => {
    // Backend provides otherUserEmail and profileImageUrl directly
    return {
      email: conversation.otherUserEmail,
      imageUrl: conversation.profileImageUrl,
      // Name and rollNo are not provided in the chat list response
      // We'll need to fetch them separately or display email only
    };
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
                          <img src={other.imageUrl} alt={other.email} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold">{other?.email?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-black">{other?.email}</p>
                        <p className="text-xs text-gray-400 truncate">{conversation.messages?.[conversation.messages.length - 1]?.content || 'No messages yet'}</p>
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
                        <img 
                          src={getOtherParticipant(selectedConversation).imageUrl} 
                          alt={getOtherParticipant(selectedConversation).email} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-sm font-bold">
                          {getOtherParticipant(selectedConversation)?.email?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black">{getOtherParticipant(selectedConversation)?.email}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => {
                      const currentUserEmail = getCurrentUserEmail();
                      const isOwn = message.sender === currentUserEmail;
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
                    <div ref={messagesEndRef} />
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
