import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import apiService, { ChatSession } from '../services/api';
import { Briefcase, CheckSquare, Mail, Users, Sparkles, Lightbulb, FlaskConical } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useChatLoading } from '../services/ChatContext';


interface SidebarProps {
  onNavClick: (view: string) => void;
  activeView: string | null;
  onToggle?: (expanded: boolean) => void;
}


// Add this utility function at the top level, before the Sidebar component
const isMobileDevice = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
};


// Custom CSS for the logo text to match the pixelated style
const logoTextStyle = {
  fontFamily: "var(--font-press-start-2p)",
  letterSpacing: "0.05em",
  fontWeight: 400,
  color: "#0f0f0f",
  fontSize: "1.2rem",
};


// Custom CSS for the navigation items to use Pixelify Sans font
const navItemStyle = {
  fontFamily: "var(--font-pixelify-sans)",
  letterSpacing: "0.02em",
  fontWeight: 400,
};


const Sidebar: React.FC<SidebarProps> = ({ onNavClick, activeView, onToggle }) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const { loadingChats } = useChatLoading();


  // Notify parent about initial sidebar state
  useEffect(() => {
    if (onToggle) {
      onToggle(isExpanded);
    }
  }, []);


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
    { id: 'what-we-do', label: 'What We Do', icon: Briefcase },
    { id: 'what-weve-done', label: "What We've Done", icon: CheckSquare },
    { id: 'research-blog', label: 'Research', icon: FlaskConical },
    { id: 'connect', label: 'Connect', icon: Mail },
    { id: 'us', label: 'Us', icon: Users },
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


    // Ensure sidebar state is properly communicated when selecting chat
    if (onToggle) {
      onToggle(isExpanded);
    }
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
    e.stopPropagation();
    setPendingDeleteId(chatId);
    setShowConfirm(true);
  };


  const confirmDelete = () => {
    if (pendingDeleteId) {
      apiService.deleteChat(pendingDeleteId);
      setChatHistory(prevHistory => prevHistory.filter(chat => chat.id !== pendingDeleteId));
      if (pendingDeleteId === currentChatId) {
        const newChatId = apiService.getCurrentChatId();
        setCurrentChatId(newChatId);
        const newMessages = newChatId ? apiService.getCurrentChatMessages() : [];
        const chatChangeEvent = new CustomEvent('chatChanged', { detail: { chatId: newChatId, messages: newMessages } });
        window.dispatchEvent(chatChangeEvent);
      }
    }
    setShowConfirm(false);
    setPendingDeleteId(null);
  };


  const cancelDelete = () => {
    setShowConfirm(false);
    setPendingDeleteId(null);
  };


  // Toggle sidebar expansion
  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    // Notify parent component about the change
    if (onToggle) {
      onToggle(newExpandedState);
    }
   
    // For debugging
    console.log("Toggle sidebar:", newExpandedState, "Mobile:", isMobile);
  };


  // Update the mobile detection useEffect
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setIsLoading(false); // Set loading to false after initial check
      // console.log("Mobile detection:", isMobileView, window.innerWidth);
    };
   
    // Initial check
    checkIfMobile();
   
    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);
   
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);


  // Auto-collapse on mobile initially - only on first render
  useEffect(() => {
    if (isMobile) {
      console.log("Mobile detected, collapsing sidebar");
      setIsExpanded(false);
      if (onToggle) {
        onToggle(false);
      }
    } else {
      // Ensure desktop starts with proper expanded state
      if (onToggle) {
        onToggle(true);
      }
    }
  // Empty dependency array ensures this only runs once on mount
  }, []);


  return (
    <>
      {/* Mobile overlay - only visible when sidebar is expanded on mobile */}
      {isExpanded && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
          style={{ touchAction: 'none' }}
        ></div>
      )}


      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen flex flex-col bg-white shadow-lg transition-all duration-300
          ${isExpanded ? 'w-62' : 'w-20'}
          border-r border-gray-100 z-[80]
          ${!isExpanded && isMobile ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
          ${isLoading ? 'invisible' : 'visible'}`}
      >
        {/* Only render sidebar content if not loading */}
        {!isLoading && (
          <>
            {/* Fixed top section with hamburger and logo */}
            <div className="flex-shrink-0">
              {/* Hamburger Toggle Button */}
              <div className="flex flex-row justify-end items-center pt-4 pb-2 px-4">
                <button
                  onClick={toggleSidebar}
                  className="bg-white rounded-full p-2 focus:outline-none hover:bg-blue-100 z-50"
                  aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {isExpanded ? (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="6" y1="6" x2="22" y2="22" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="22" y1="6" x2="6" y2="22" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="6" y1="9" x2="22" y2="9" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="6" y1="14" x2="22" y2="14" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                      <line x1="6" y1="19" x2="22" y2="19" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>


              {/* Logo/Profile Section */}
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => {
                  // Reset to initial view first
                  onNavClick('');
                 
                  // Create a new chat
                  const newChatId = apiService.createNewChat();
                  setCurrentChatId(newChatId);
                 
                  // Notify components about the new chat
                  const chatChangeEvent = new CustomEvent('chatChanged', {
                    detail: { chatId: newChatId, messages: [] }
                  });
                  window.dispatchEvent(chatChangeEvent);
                 
                  // On mobile, close the sidebar after navigation
                  if (isMobile) {
                    toggleSidebar();
                  }
                }}
              >
                <Image
                  src="/images/nicorai-logo-black.svg"
                  alt="NicorAI Logo"
                  width={isExpanded ? 56 : 35}
                  height={isExpanded ? 56 : 35}
                  className="rounded-full object-contain transition-all duration-300 hover:opacity-80"
                  priority
                />
                {isExpanded && (
                  <span className="mt-2 text-lg text-gray-900 hover:text-blue-600 transition-colors" style={{ fontFamily: "var(--font-press-start-2p)" }}>NicorAI</span>
                )}
              </div>
            </div>

            {/* Scrollable content section */}
            <div className="flex-1 overflow-y-auto sidebar-scroll flex flex-col">
              {/* Main content (menu + recent chats) */}
              <div className="flex-1 flex flex-col">
                {/* Menu Items */}
                <nav className="flex flex-col items-center mt-4 w-full">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleNavClick(item.id);
                          if (isMobile) {
                            toggleSidebar();
                          }
                        }}
                        className={`flex items-center w-full px-4 py-2 my-1 rounded-lg transition-colors
                          ${activeView === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}
                          ${isExpanded ? 'justify-start' : 'justify-center'}
                        `}
                      >
                        <Icon className="w-6 h-6" />
                        {isExpanded && <span className="ml-4 text-base font-medium">{item.label}</span>}
                      </button>
                    );
                  })}
                </nav>

                {/* Recent Chats Section */}
                <div className={`${isExpanded ? 'p-4 border-t border-gray-200 mt-2' : 'p-2 mt-4'}`}>
                  {isExpanded && (
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-semibold text-gray-800">Recent Chat</h2>
                      {chatHistory.length > 0 && (
                        <button
                          onClick={() => setShowClearAllConfirm(true)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  )}
                 
                  <ul className="space-y-2">
                    {/* New Chat Button styled like a chat history item */}
                    <li className="group">
                      <div
                        onClick={() => {
                          // Reset to initial view first
                          onNavClick('');
                         
                          // Create a new chat
                          const newChatId = apiService.createNewChat();
                          setCurrentChatId(newChatId);
                         
                          // Notify other components
                          const chatChangeEvent = new CustomEvent('chatChanged', {
                            detail: { chatId: newChatId, messages: [] }
                          });
                          window.dispatchEvent(chatChangeEvent);
                         
                          // On mobile, close the sidebar after creating a new chat
                          if (isMobile && isExpanded) {
                            toggleSidebar();
                          }
                        }}
                        className={`flex items-start ${isExpanded ? 'p-2 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border border-dashed border-gray-300' : 'p-0.5 justify-center'}`}
                      >
                        <div className={`flex-1 min-w-0 flex ${isExpanded ? 'items-center' : 'justify-center'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${isExpanded ? 'w-4 h-4 mr-2' : 'w-6 h-6'} text-blue-600`}>
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                          </svg>
                          {isExpanded && (
                            <p className="text-sm font-medium text-blue-600">
                              New Chat
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                   
                    {/* Chat history - only visible when expanded */}
                    {isExpanded && (
                      <>
                        {chatHistory.length > 0 ? (
                          chatHistory.map((chat) => (
                            <li key={chat.id} className="group">
                              <div
                                onClick={() => {
                                  handleSelectChat(chat.id);
                                  // On mobile, close the sidebar after selecting a chat
                                  if (isMobile) {
                                    toggleSidebar();
                                  }
                                }}
                                className={`flex items-start p-2 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer relative ${
                                  chat.id === currentChatId ? 'bg-blue-50 border-l-2 border-blue-600 pl-3.5' : ''
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
                                  } group-hover:text-blue-500 flex items-center gap-2`}>
                                    {formatChatDate(chat.lastUpdated)}
                                    {loadingChats[chat.id] && (
                                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                  </p>
                                </div>
                                {/* Always show delete button, on all screen sizes */}
                                <button
                                  onClick={(e) => handleDeleteChat(e, chat.id)}
                                  className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
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
                          <li className="text-sm text-gray-500 italic px-4">No recent chats</li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Footer: Social Media and Copyright - scrolls with content, but pushed to bottom if short */}
              <div className={`p-4 border-t border-gray-200 mt-auto`}>
                {/* Social Media Icons */}
                <div className={`flex ${isExpanded ? 'justify-center space-x-6' : 'flex-col space-y-4 items-center'} mb-3`}>
                  <Link href="https://www.linkedin.com/company/nicorai/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <img src="/images/linkedin.svg" alt="LinkedIn" width={27} height={27} className="object-contain" />
                  </Link>
                  <Link href="https://x.com/nicor_ai" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <img src="/images/X_logo_2023_original.svg" alt="X" width={24} height={24} className="object-contain" />
                  </Link>
                </div>
                {/* Copyright Notice */}
                {isExpanded ? (
                  <p className="text-xs text-center text-gray-500 mt-2">© 2025 NicorAI Ltd All rights reserved.</p>
                ) : (
                  <p className="text-xs text-center text-gray-500 mt-2">©</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
     
      {/* Mobile toggle button - always visible when on mobile and sidebar is collapsed */}
      {isMobile && !isExpanded && !isLoading && (
        <div className="fixed top-0 left-0 z-[100] p-4">
          <button
            onClick={() => {
              console.log("Mobile button clicked, current state:", isExpanded);
              // Force expanded state to true
              setIsExpanded(true);
              if (onToggle) {
                onToggle(true);
              }
              console.log("After click, state set to:", true);
            }}
            className="bg-white border border-gray-200 rounded-full p-2 shadow-lg focus:outline-none hover:bg-blue-50"
            aria-label="Expand sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        title="Delete Chat"
        description="Are you sure you want to delete this chat?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      {/* Confirm Modal for Clear All */}
      <ConfirmModal
        open={showClearAllConfirm}
        title="Clear All Chats"
        description="Are you sure you want to clear all chat history?"
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={() => {
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
          setShowClearAllConfirm(false);
        }}
        onCancel={() => setShowClearAllConfirm(false)}
      />
    </>
  );
};

export default Sidebar;