'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import apiService, { ChatMessage, ChatSession } from './api';


interface ChatContextType {
  currentChatId: string | null;
  messages: ChatMessage[];
  chatHistory: ChatSession[];
  isLoading: boolean;
  setCurrentChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  createNewChat: () => void;
  deleteChat: (chatId: string) => void;
  clearAllChats: () => void;
}


const ChatContext = createContext<ChatContextType | undefined>(undefined);


interface ChatLoadingContextType {
  loadingChats: { [chatId: string]: boolean };
  setLoadingForChat: (chatId: string, loading: boolean) => void;
}


const ChatLoadingContext = createContext<ChatLoadingContextType | undefined>(undefined);


export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);


  // Initialize chat data when the component mounts
  useEffect(() => {
    const loadChatData = () => {
      const history = apiService.getChatHistory();
      setChatHistory(history);
     
      const currChatId = apiService.getCurrentChatId();
      setCurrentChatId(currChatId);
     
      if (currChatId) {
        const messages = apiService.getCurrentChatMessages();
        setMessages(messages);
      }
    };
   
    loadChatData();
   
    // Set up an interval to periodically check for updates
    const intervalId = setInterval(loadChatData, 3000);
   
    // Add event listener for storage changes (to sync across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nicoraiChatHistory') {
        loadChatData();
      }
    };
   
    window.addEventListener('storage', handleStorageChange);
   
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  // Set current chat and update messages
  const handleSetCurrentChat = (chatId: string) => {
    apiService.setCurrentChat(chatId);
    setCurrentChatId(chatId);
   
    const messages = apiService.getCurrentChatMessages();
    setMessages(messages);
  };


  // Create a new chat
  const handleCreateNewChat = () => {
    const newChatId = apiService.createNewChat();
    setCurrentChatId(newChatId);
    setMessages([]);
   
    // Update chat history
    setChatHistory(apiService.getChatHistory());
  };


  // Send a message
  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
   
    try {
      await apiService.sendMessage(content);
     
      // Update messages
      const updatedMessages = apiService.getCurrentChatMessages();
      setMessages(updatedMessages);
     
      // Update chat history
      setChatHistory(apiService.getChatHistory());
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  // Delete a chat
  const handleDeleteChat = (chatId: string) => {
    apiService.deleteChat(chatId);
   
    // Update chat history
    const updatedHistory = apiService.getChatHistory();
    setChatHistory(updatedHistory);
   
    // If we deleted the current chat, update current chat data
    if (chatId === currentChatId) {
      const newCurrentChatId = apiService.getCurrentChatId();
      setCurrentChatId(newCurrentChatId);
     
      if (newCurrentChatId) {
        const newMessages = apiService.getCurrentChatMessages();
        setMessages(newMessages);
      } else {
        setMessages([]);
      }
    }
  };


  // Clear all chats
  const handleClearAllChats = () => {
    apiService.clearAllChats();
   
    // Reset state
    const newChatId = apiService.getCurrentChatId();
    setCurrentChatId(newChatId);
    setMessages([]);
    setChatHistory(apiService.getChatHistory());
  };


  const value = {
    currentChatId,
    messages,
    chatHistory,
    isLoading,
    setCurrentChat: handleSetCurrentChat,
    sendMessage: handleSendMessage,
    createNewChat: handleCreateNewChat,
    deleteChat: handleDeleteChat,
    clearAllChats: handleClearAllChats
  };


  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};


// Hook for accessing the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};


export const useChatLoading = () => {
  const context = useContext(ChatLoadingContext);
  if (!context) {
    throw new Error('useChatLoading must be used within a ChatLoadingProvider');
  }
  return context;
};


export const ChatLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loadingChats, setLoadingChats] = useState<{ [chatId: string]: boolean }>({});
  
  // Store loading timeout references to clear them when needed
  const loadingTimeouts = useRef<{ [chatId: string]: NodeJS.Timeout }>({});

  const setLoadingForChat = (chatId: string, loading: boolean) => {
    // If chatId is empty or null, use a default key
    const key = chatId || 'default-chat';
    
    // Clear any existing timeout for this chat
    if (loadingTimeouts.current[key]) {
      clearTimeout(loadingTimeouts.current[key]);
      delete loadingTimeouts.current[key];
    }
    
    // Update loading state
    setLoadingChats(prev => ({ ...prev, [key]: loading }));
    
    // Set a safety timeout to clear loading state after 30 seconds
    // This prevents infinite loading if something goes wrong
    if (loading) {
      loadingTimeouts.current[key] = setTimeout(() => {
        console.log(`Auto-clearing loading state for chat ${key} after timeout`);
        setLoadingChats(prev => ({ ...prev, [key]: false }));
      }, 30000); // 30 seconds timeout
    }
  };
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(loadingTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <ChatLoadingContext.Provider value={{ loadingChats, setLoadingForChat }}>
      {children}
    </ChatLoadingContext.Provider>
  );
};

