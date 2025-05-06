"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import ChatInput from './components/ChatInput';
import DynamicViewRenderer from './components/DynamicViewRenderer';
import apiService from './services/api';

export default function Home() {
  const [activeView, setActiveView] = useState<string | null>(null);
  const [hasMessages, setHasMessages] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isInitialView, setIsInitialView] = useState(true);

  // Check if there are existing messages on initial load
  useEffect(() => {
    const currentMessages = apiService.getCurrentChatMessages();
    if (currentMessages.length > 0) {
      setHasMessages(true);
      setIsInitialView(false);
    }
  }, []);
  
  // Listen for chat selection from history
  useEffect(() => {
    const handleChatChange = (e: CustomEvent) => {
      // Make sure the chat becomes visible when a chat is selected from history
      if (e.detail.messages && e.detail.messages.length > 0) {
        // Clear any active view when a chat is selected
        setActiveView(null);
        setIsChatVisible(true);
        setIsInitialView(false);
      }
    };
    
    // Add event listener for chat changed events
    window.addEventListener('chatChanged', handleChatChange as EventListener);
    
    return () => {
      window.removeEventListener('chatChanged', handleChatChange as EventListener);
    };
  }, []);

  // Function to handle sending a message in the chat
  // This is now also used to handle closing the chat
  const handleMessageSent = (isClosing = false) => {
    if (!isClosing) {
      setHasMessages(true);
      setIsInitialView(false);
      
      // If a view is active, hide it
      if (activeView) {
        setActiveView(null);
      }
      
      // Ensure chat is visible
      setIsChatVisible(true);
    } else {
      // Handle closing the chat
      
      // If no tab was selected (activeView is null) and we're not in initial view,
      // we should return to the initial view
      if (!activeView && !isInitialView) {
        setIsInitialView(true);
        setIsChatVisible(true); // Keep chat visible but in initial view
      } 
      // If a tab was selected previously, make it visible again
      else if (activeView) {
        setIsChatVisible(false);
      }
      // Otherwise if we're already in initial view, just hide the chat
      else {
        setIsChatVisible(false);
      }
    }
  };

  // Handle navigation clicks from the sidebar
  const handleNavClick = (view: string) => {
    // Store previous active view
    const prevActiveView = activeView;
    
    // Update the active view
    setActiveView(view);
    
    // If this is the first tab click, mark as no longer in initial view
    if (isInitialView) {
      setIsInitialView(false);
    }
    
    // Hide chat when navigating to a view, but only if
    // we're currently showing the chat or changing views
    if (isChatVisible || prevActiveView !== view) {
      setIsChatVisible(false);
    }
  };

  // Handle closing a view
  const handleCloseView = () => {
    setActiveView(null);
    
    // If we have a chat history, show the chat in non-initial view
    const currentMessages = apiService.getCurrentChatMessages();
    if (currentMessages.length > 0) {
      setIsInitialView(false);
      setIsChatVisible(true);
    } 
    // If no chat history, show initial view
    else {
      setIsInitialView(true);
      setIsChatVisible(true);
    }
  };

  // Set up global keyboard handler for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <main className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar onNavClick={handleNavClick} activeView={activeView} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 h-screen overflow-hidden flex flex-col relative">
        {/* Render active view */}
        {activeView && (
          <DynamicViewRenderer 
            viewId={activeView} 
            onClose={handleCloseView} 
          />
        )}
        
        {/* Render chat if visible */}
        {isChatVisible && <Chat isVisible={true} onMessageSent={handleMessageSent} isInitialView={isInitialView} />}
        
        {/* If nothing is visible, show a fallback */}
        {!activeView && !isChatVisible && !isInitialView && (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => {
                // Create a new chat when entering chat from closed state
                const newChatId = apiService.createNewChat();
                
                // Notify components about the new chat
                const chatChangeEvent = new CustomEvent('chatChanged', { 
                  detail: { chatId: newChatId, messages: [] }
                });
                window.dispatchEvent(chatChangeEvent);
                
                // Show chat view
                setIsChatVisible(true);
                setIsInitialView(true); // Show initial welcome view for the new chat
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Chatting
            </button>
          </div>
        )}

        {/* Fixed chat input box at the bottom (visible on all pages except initial view) */}
        {!isInitialView && !isChatVisible && activeView && (
          <div className="fixed bottom-0 left-64 right-0 border-t border-gray-200 bg-white p-4 shadow-md z-10">
            <ChatInput onMessageSent={handleMessageSent} />
          </div>
        )}
      </div>
    </main>
  );
}
