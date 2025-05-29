"use client";

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import ChatInput from './components/ChatInput';
import DynamicViewRenderer from './components/DynamicViewRenderer';
import apiService from './services/api';

export default function Home() {
  const [activeView, setActiveView] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isInitialView, setIsInitialView] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isChatExplicitlyClosed, setIsChatExplicitlyClosed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Track last loading chatId
  const lastLoadingChatIdRef = useRef<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { loadingChats } = require('./services/ChatContext'); // Import here to avoid circular import issues

  // On initial load, always show the initial landing page (isInitialView = true), regardless of chat history
  useEffect(() => {
    setIsInitialView(true);
    setIsChatVisible(true);
    setActiveView(null);
    
    // Clear the current chat ID on page refresh to ensure new messages start a new chat
    apiService.setCurrentChat('');
    
    // Force a refresh of the chat state
    const chatChangeEvent = new CustomEvent('chatChanged', {
      detail: { chatId: '', messages: [] }
    });
    window.dispatchEvent(chatChangeEvent);
  }, []);
 
  // Listen for chat selection from history
  useEffect(() => {
    const handleChatChange = (e: CustomEvent) => {
      // If chat ID exists, ensure the chat view is shown regardless of messages
      if (e.detail.chatId) {
        setActiveView(null);
        setIsChatVisible(true);
        setSelectedChatId(e.detail.chatId); // Track selected chat
        // If there are no messages, this is a new chat, so show initial view
        if (!e.detail.messages || e.detail.messages.length === 0) {
          setIsInitialView(true);
        } else {
          setIsInitialView(false);
        }
        setIsChatExplicitlyClosed(false);
        // Reset last loading chatId
        lastLoadingChatIdRef.current = null;
        return;
      }
      // If messages are empty and no chatId, reset to initial view
      if (!e.detail.messages || e.detail.messages.length === 0) {
        setActiveView(null);
        setIsChatVisible(true);
        setIsInitialView(true);
        setSelectedChatId(null);
        // Reset last loading chatId
        lastLoadingChatIdRef.current = null;
        return;
      }
      // Make sure the chat becomes visible when a chat is selected from history
      if (e.detail.messages && e.detail.messages.length > 0) {
        setActiveView(null);
        setIsChatVisible(true);
        setIsInitialView(false);
        setIsChatExplicitlyClosed(false);
        setSelectedChatId(e.detail.chatId);
        // Reset last loading chatId
        lastLoadingChatIdRef.current = null;
      }
    };
   
    // Add event listener for chat changed events
    window.addEventListener('chatChanged', handleChatChange as EventListener);
   
    return () => {
      window.removeEventListener('chatChanged', handleChatChange as EventListener);
    };
  }, []);

  // Track loading chats to detect when a response is received for a closed chat
  useEffect(() => {
    // Poll loadingChats from ChatContext
    const interval = setInterval(() => {
      const loadingChatsObj = require('./services/ChatContext').useChatLoading().loadingChats;
      const loadingChatIds = Object.keys(loadingChatsObj).filter(
        (id) => loadingChatsObj[id]
      );
      if (loadingChatIds.length > 0) {
        lastLoadingChatIdRef.current = loadingChatIds[0];
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // When a response is received for a chat that was loading and the chat is closed, open it
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const chatId = e.detail.chatId;
      const messages = e.detail.messages;
      // If the chat was loading, is now not loading, and the chat is closed, open it
      if (
        lastLoadingChatIdRef.current &&
        chatId === lastLoadingChatIdRef.current &&
        isChatExplicitlyClosed &&
        messages && messages.length > 0 &&
        messages[messages.length - 1].sender === 'ai'
      ) {
        setIsChatVisible(true);
        setIsInitialView(false);
        setIsChatExplicitlyClosed(false);
        lastLoadingChatIdRef.current = null;
      }
    };
    window.addEventListener('chatChanged', handler as EventListener);
    return () => window.removeEventListener('chatChanged', handler as EventListener);
  }, [isChatExplicitlyClosed]);

  // Function to handle sending a message in the chat
  const handleMessageSent = (isClosing?: boolean) => {
    // Check for existing messages
    const hasExistingMessages = apiService.getCurrentChatMessages().length > 0;
   
    if (isClosing) {
      // Regular closing behavior
      // If no tab was selected (activeView is null) and we're not in initial view,
      // we should return to the initial view
      if (!activeView && !isInitialView) {
        setIsInitialView(true);
        setIsChatVisible(true); // Keep chat visible but in initial view
        // Mark chat as explicitly closed
        setIsChatExplicitlyClosed(true);
        // DO NOT clear current chat ID here
      }
      // If a tab was selected previously, make it visible again
      else if (activeView) {
        setIsChatVisible(false);
        // Mark chat as explicitly closed
        setIsChatExplicitlyClosed(true);
        // DO NOT clear current chat ID here
      }
      // Otherwise if we're already in initial view, just hide the chat
      else {
        setIsChatVisible(false);
        // Mark chat as explicitly closed
        setIsChatExplicitlyClosed(true);
        // DO NOT clear current chat ID here
      }
    } else {
      // Normal message sending behavior - not closing
     
      // When we have existing messages, switch to chat view mode
      if (hasExistingMessages) {
        setIsInitialView(false);
      }
     
      setIsChatVisible(true); // Always show chat when a message is sent
     
      // Reset the explicit close state when sending a message
      setIsChatExplicitlyClosed(false);
     
      // If a view is active, hide it
      if (activeView) {
        setActiveView(null);
      }
    }
  };

  // Handle navigation clicks from the sidebar
  const handleNavClick = (view: string) => {
    // Store previous active view
    const prevActiveView = activeView;
   
    setActiveView(view);
   
    // If this is the first tab click, mark as no longer in initial view
    if (isInitialView) {
      setIsInitialView(false);
    }
   
    // Hide chat when navigating to a view, but only if
    // we're currently showing the chat or changing views
    if (isChatVisible || prevActiveView !== view) {
      setIsChatVisible(false);
      // Do NOT set isChatExplicitlyClosed here; preserve chat state when switching tabs
    }
  };

  // Handle closing a view
  const handleCloseView = () => {
    setActiveView(null);
    setIsInitialView(true); // Show landing page after closing a tab
    setIsChatVisible(true); // Always show chat/landing after closing a tab
  };

  // Handle sidebar toggle
  const handleSidebarToggle = (expanded: boolean) => {
    setIsSidebarExpanded(expanded);
  };

  // Update isMobile state
  useEffect(() => {
    const checkIfMobile = () => {
      const windowWidth = window.innerWidth;
      const mobileDetected = windowWidth < 768;
      setIsMobile(mobileDetected);
      
      // On mobile, always collapse sidebar
      if (mobileDetected) {
        setIsSidebarExpanded(false);
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to close active view
      if (e.key === 'Escape' && activeView) {
        handleCloseView();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeView]);

  return (
    <main className="flex min-h-screen h-screen bg-gray-50 overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar
        onNavClick={handleNavClick}
        activeView={activeView}
        expanded={isSidebarExpanded}
        onToggle={handleSidebarToggle}
        setSelectedChatId={setSelectedChatId} // Pass setter to sidebar
      />
      
      {/* Main Content - position absolute with left margin matching sidebar width */}
      <div 
        className="absolute top-0 right-0 bottom-0 left-0 overflow-auto transition-all duration-300 z-20 flex flex-col"
        style={{ 
          marginLeft: isMobile ? 
            '0' : // On mobile, don't add margin as sidebar is overlaid
            (isSidebarExpanded ? '15.5rem' : '5rem') // w-62 = 15.5rem (248px), w-20 = 5rem (80px)
        }}
      >
        {/* Chat Component */}
        <Chat
          isVisible={isChatVisible}
          onMessageSent={handleMessageSent}
          isInitialView={isInitialView}
          chatId={selectedChatId} // Pass selected chatId
        />
        
        {/* Dynamic View Renderer */}
        {activeView && (
          <DynamicViewRenderer
            viewId={activeView}
            onClose={handleCloseView}
          />
        )}
      </div>
      
      {/* Global ChatInput - visible when a tab is active or chat is not visible */}
      {(activeView || (!isChatVisible && !isInitialView)) && (
        <div className="fixed bottom-0 left-0 right-0 z-30"
          style={{ 
            marginLeft: isMobile ? 
              '0' : // On mobile, don't add margin as sidebar is overlaid
              (isSidebarExpanded ? '15.5rem' : '5rem') // w-62 = 15.5rem (248px), w-20 = 5rem (80px)
          }}>
          <div className="bg-white rounded-xl shadow-lg p-2">
            <ChatInput 
              onMessageSent={handleMessageSent} 
              isChatExplicitlyClosed={isChatExplicitlyClosed}
              chatId={selectedChatId} // Pass selected chatId
            />
          </div>
        </div>
      )}
    </main>
  );
}









