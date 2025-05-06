import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import apiService, { ChatSession } from '../services/api';

interface SidebarProps {
  onNavClick: (view: string) => void;
  activeView: string | null;
}

// Custom CSS for the logo text to match the pixelated style
const logoTextStyle = {
  fontFamily: "'Pixelify Sans', 'PixelifyFallback', monospace",
  letterSpacing: "0.05em",
  fontWeight: 600,
  color: "#0f0f0f",
  fontSize: "2rem",
};

const Sidebar: React.FC<SidebarProps> = ({ onNavClick, activeView }) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Fetch chat history when component mounts or when localStorage changes
  useEffect(() => {
    const loadChatHistory = () => {
      const history = apiService.getChatHistory();
      setChatHistory(history);
      setCurrentChatId(apiService.getCurrentChatId());
    };
    
    // Load initial history
    loadChatHistory();
    
    // Set up an interval to periodically check for updates (every 5 seconds)
    const intervalId = setInterval(loadChatHistory, 5000);
    
    // Add event listener for storage changes (to sync across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nicoraiChatHistory') {
        loadChatHistory();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const navItems = [
    { id: 'what-we-do', label: 'What We Do' },
    { id: 'what-weve-done', label: 'What We\'ve Done' },
    { id: 'connect', label: 'Connect' },
    { id: 'us', label: 'Us' },
  ];

  const handleNavClick = (id: string) => {
    onNavClick(id);
  };

  // Handle selecting a chat from the history
  const handleSelectChat = (chatId: string) => {
    apiService.setCurrentChat(chatId);
    setCurrentChatId(chatId);
    
    // Update local state - no need to reload the page
    const currentMessages = apiService.getCurrentChatMessages();
    
    // Create a custom event to notify other components of the chat change
    const chatChangeEvent = new CustomEvent('chatChanged', { 
      detail: { chatId, messages: currentMessages }
    });
    window.dispatchEvent(chatChangeEvent);
  };

  // Format the date for display in the sidebar
  const formatChatDate = (date: Date) => {
    const now = new Date();
    const chatDate = new Date(date);
    
    // If the chat is from today, show the time
    if (chatDate.toDateString() === now.toDateString()) {
      return chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If the chat is from yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (chatDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, show the date
    return chatDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Handle deleting a chat
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
      apiService.deleteChat(chatId);
      
      // Update the local state
      setChatHistory(prevHistory => prevHistory.filter(chat => chat.id !== chatId));
      
      // If we deleted the current chat, update messages
      if (chatId === currentChatId) {
        const newChatId = apiService.getCurrentChatId();
        setCurrentChatId(newChatId);
        
        // Get messages for the new current chat
        const newMessages = newChatId ? apiService.getCurrentChatMessages() : [];
        
        // Notify other components
        const chatChangeEvent = new CustomEvent('chatChanged', { 
          detail: { chatId: newChatId, messages: newMessages }
        });
        window.dispatchEvent(chatChangeEvent);
      }
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Image 
            src="/images/nicor-logo-black-removebg_without_text.png" 
            alt="NicorAI Logo" 
            width={48} 
            height={48} 
            className="object-contain"
            priority
          />
          <h1 className="pixelify-text" style={logoTextStyle}>NicorAI</h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-semibold ${
                  activeView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Recent Chats Section */}
      <div className="p-4 border-t border-gray-200 mt-2 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-800">Recent Chats</h2>
          {chatHistory.length > 0 && (
            <button 
              onClick={() => {
                if (window.confirm('Clear all chat history? This cannot be undone.')) {
                  apiService.clearAllChats();
                  setChatHistory([]);
                  
                  // Update current chat ID
                  const newChatId = apiService.getCurrentChatId();
                  setCurrentChatId(newChatId);
                  
                  // Notify other components
                  const chatChangeEvent = new CustomEvent('chatChanged', { 
                    detail: { chatId: newChatId, messages: [] }
                  });
                  window.dispatchEvent(chatChangeEvent);
                }
              }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
        
        <ul className="space-y-2">
          {/* New Chat Button styled like a chat history item */}
          <li className="group">
            <div 
              onClick={() => {
                const newChatId = apiService.createNewChat();
                setCurrentChatId(newChatId);
                
                // Notify other components
                const chatChangeEvent = new CustomEvent('chatChanged', { 
                  detail: { chatId: newChatId, messages: [] }
                });
                window.dispatchEvent(chatChangeEvent);
              }}
              className="flex items-start p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border border-dashed border-gray-300"
            >
              <div className="flex-1 min-w-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 text-blue-600">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                <p className="text-sm font-medium text-blue-600">
                  New Chat
                </p>
              </div>
            </div>
          </li>
          
          {chatHistory.length > 0 ? (
            chatHistory.map((chat) => (
              <li key={chat.id} className="group">
                <div 
                  onClick={() => handleSelectChat(chat.id)}
                  className={`flex items-start p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer ${
                    chat.id === currentChatId ? 'bg-blue-50 border-l-2 border-blue-600 pl-1.5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate group-hover:text-blue-600 ${
                      chat.id === currentChatId ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {chat.title}
                    </p>
                    <p className={`text-xs ${
                      chat.id === currentChatId ? 'text-blue-500' : 'text-gray-600'
                    } group-hover:text-blue-500`}>
                      {formatChatDate(chat.lastUpdated)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                    title="Delete chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500 italic">No recent chats</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar; 