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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);
  const currentChatIdRef = useRef(null);

  useEffect(() => {
    initSocket();
    fetchConversations();

    return () => {
      offNewMessage();
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    onNewMessage((message) => {
      if (currentChatIdRef.current === message.chatId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }

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
    const prefilledMessage = searchParams.get('message');
    
    if (prefilledMessage) {
      setNewMessage(decodeURIComponent(prefilledMessage));
    }
    
    if (chatId && !loading && conversations) {
      const conv = conversations.find(c => c.id === chatId);
      if (conv) {
        setSelectedConversation(conv);
        currentChatIdRef.current = conv.id;
        fetchMessages(conv.id);
        joinChat(conv.id);
      }
    } else if (userEmail && !loading && conversations) {
      const conv = conversations.find(c => 
        c.user1 === userEmail || c.user2 === userEmail
      );
      
      if (conv) {
        setSelectedConversation(conv);
        currentChatIdRef.current = conv.id;
        fetchMessages(conv.id);
        joinChat(conv.id);
      } else {
        createNewConversation(userEmail);
      }
    }
  }, [searchParams, conversations, loading]);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getAllChats();
      setConversations(response.data);
    } catch (error) {
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
      
      const newConv = response.data;
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      currentChatIdRef.current = newConv.id;
      setMessages([]);
      joinChat(newConv.id);
      toast.success('Chat opened! Start messaging.');
    } catch (error) {
      toast.error('Failed to open chat');
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await messageAPI.getChatById(chatId);
      setMessages(response.data.messages || []);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      await messageAPI.sendMessage(selectedConversation.id, {
        content: messageContent,
      });
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(messageContent);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    currentChatIdRef.current = conversation.id;
    fetchMessages(conversation.id);
    setShowMobileChat(true);
    
    joinChat(conversation.id);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentUserEmail = () => {
    return user?.email || user?.clerkId || user?.userEmail || localStorage.getItem('userEmail');
  };

  const getOtherParticipant = (conversation) => {
    return {
      email: conversation.otherUserEmail,
      name: conversation.otherUserName,
      imageUrl: conversation.profileImageUrl,
    };
  };

  return (
    <div className="h-screen bg-white md:bg-gray-50 text-black font-sans selection:bg-black selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 flex overflow-hidden">
        <div className="bg-white flex-1 flex overflow-hidden">
          <div className="flex h-full w-full">
            {/* Conversations List */}
            <div 
              className={`w-full md:w-80 border-r border-gray-100 overflow-y-auto flex-shrink-0 ${
                showMobileChat ? 'hidden md:block' : 'block'
              }`}
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#9CA3AF #F3F4F6'
              }}
            >
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
                          <img src={other.imageUrl} alt={other.name || other.email} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold">{(other?.name || other?.email)?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-black truncate">{other?.name || other?.email}</p>
                        <p className="text-xs text-gray-400 truncate">{conversation.messages?.[conversation.messages.length - 1]?.content || 'No messages yet'}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Messages Area */}
            <div className={`flex-1 flex flex-col ${
              showMobileChat ? 'block' : 'hidden md:flex'
            }`}>
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    {/* Back Button - Mobile Only */}
                    <button
                      onClick={handleBackToList}
                      className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {getOtherParticipant(selectedConversation)?.imageUrl ? (
                        <img 
                          src={getOtherParticipant(selectedConversation).imageUrl} 
                          alt={getOtherParticipant(selectedConversation).name || getOtherParticipant(selectedConversation).email} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-sm font-bold">
                          {(getOtherParticipant(selectedConversation)?.name || getOtherParticipant(selectedConversation)?.email)?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{getOtherParticipant(selectedConversation)?.name || getOtherParticipant(selectedConversation)?.email}</p>
                      {getOtherParticipant(selectedConversation)?.name && (
                        <p className="text-[10px] text-gray-400 font-medium truncate">{getOtherParticipant(selectedConversation)?.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div 
                    className="flex-1 overflow-y-auto p-6 space-y-4"
                    style={{ 
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#9CA3AF #F3F4F6'
                    }}
                  >
                    {messages.map((message) => {
                      const currentUserEmail = getCurrentUserEmail();
                      const isOwn = message.sender === currentUserEmail;
                      return (
                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md ${isOwn ? 'bg-black text-white' : 'bg-gray-100 text-black'} rounded-2xl overflow-hidden`}>
                            {/* Listing Reference */}
                            {message.listingReference && (
                              <div className={`p-3 border-b ${isOwn ? 'border-white/20' : 'border-gray-200'}`}>
                                <div className="flex gap-3 items-center">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                    {message.listingReference.imageUrl ? (
                                      <img 
                                        src={message.listingReference.imageUrl} 
                                        alt={message.listingReference.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold uppercase tracking-wider ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
                                      {message.listingReference.type}
                                    </p>
                                    <p className={`text-sm font-black truncate ${isOwn ? 'text-white' : 'text-black'}`}>
                                      {message.listingReference.title}
                                    </p>
                                    <p className={`text-xs font-medium ${isOwn ? 'text-white/70' : 'text-gray-600'}`}>
                                      {message.listingReference.price ? `Rs ${message.listingReference.price}` : 
                                       message.listingReference.withTitle || 'Negotiable'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Message Content */}
                            <div className="px-4 py-3">
                              <p className="text-sm font-medium">{message.content}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
                    <div className="flex gap-3 items-center">
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
                        className={`w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all ${
                          !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
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
