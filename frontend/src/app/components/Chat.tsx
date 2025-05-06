import React, { useState, useRef, useEffect } from 'react';
import apiService, { ChatMessage, DynamicView } from '../services/api';
import DynamicContentRenderer from './DynamicContentRenderer';

interface ChatProps {
  isVisible: boolean;
  onMessageSent?: (isClosing?: boolean) => void;
  isInitialView?: boolean;
}

const Chat: React.FC<ChatProps> = ({ isVisible, onMessageSent, isInitialView }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicView, setDynamicView] = useState<DynamicView | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const faqSuggestions = [
    "How can AI help my business?",
    "What services does NicorAI offer?",
    "How do I get started with NicorAI?",
    "What industries do you specialize in?"
  ];

  // Load messages from the API service when the component mounts
  useEffect(() => {
    const loadMessages = () => {
      const currentMessages = apiService.getCurrentChatMessages();
      setMessages(currentMessages);
    };
    
    // Load initial messages
    loadMessages();
    
    // Listen for chat change events
    const handleChatChange = (e: CustomEvent) => {
      setMessages(e.detail.messages);
    };
    
    // Add event listeners
    window.addEventListener('chatChanged', handleChatChange as EventListener);
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'nicoraiChatHistory') {
        loadMessages();
      }
    });
    
    return () => {
      window.removeEventListener('chatChanged', handleChatChange as EventListener);
      window.removeEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'nicoraiChatHistory') {
          loadMessages();
        }
      });
    };
  }, []);

  // Listen for when isInitialView changes
  useEffect(() => {
    // If we're returning to the initial view, clear the messages
    // so we treat it as a new chat
    if (isInitialView) {
      setMessages([]);
    }
  }, [isInitialView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle sending a message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    // If in initial view, create a new chat before sending
    if (isInitialView) {
      const newChatId = apiService.createNewChat();
    }
    
    // Notify parent that a message was sent
    onMessageSent?.(false);
    
    // Create a user message object to display immediately
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content: content,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Update UI immediately with the user message
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    try {
      // Use the API service to get a response
      const aiResponse = await apiService.sendMessage(content);
      
      // Update local messages state from the API service
      setMessages(apiService.getCurrentChatMessages());

      // Check if we should show a dynamic view
      // This is just an example - in a real app, the backend would determine this
      if (content.toLowerCase().includes('chart') || content.toLowerCase().includes('report')) {
        const view = await apiService.getDynamicView('chart-example');
        if (view) {
          setDynamicView(view);
        }
      } else if (content.toLowerCase().includes('info') || content.toLowerCase().includes('details')) {
        const view = await apiService.getDynamicView('card-example');
        if (view) {
          setDynamicView(view);
        }
      }
    } catch (error) {
      setError('Failed to connect to the server. The API Gateway might be offline or experiencing issues. Please try again later.');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleFaqClick = (question: string) => {
    // If in initial view, create a new chat before sending FAQ
    if (isInitialView) {
      apiService.createNewChat();
    }
    
    sendMessage(question);
  };

  const handleCloseDynamicView = () => {
    setDynamicView(null);
    
    // If we're in initial view, keep showing initial view
    if (isInitialView && onMessageSent) {
      onMessageSent(false); // Ensure we're not closing the chat
    }
  };

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Show Close button if we're forced to show initial view but have messages */}
      {!isInitialView && messages.length > 0 && (
        <div className="absolute top-0 right-0 p-3">
          <button 
            onClick={() => {
              // Pass true to indicate we're closing the chat
              onMessageSent?.(true);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors flex items-center"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Close
          </button>
        </div>
      )}
      
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to <span className="text-blue-600">NicorAI</span> Assistant</h2>
          <p className="text-gray-700">How can I help you today?</p>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-4 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-24 placeholder-gray-500 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Frequently asked questions:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faqSuggestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleFaqClick(question)}
                className="p-3 text-left text-sm rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="flex flex-col h-full relative">
      {/* Header section with close button */}
      <div className="p-3 flex justify-end border-b border-gray-100">
        <button 
          onClick={() => {
            // Notify parent component to hide the chat view
            if (onMessageSent) {
              // Pass true to indicate we're closing the chat
              onMessageSent(true);
            }
          }}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
          title="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 px-6">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-4 ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
          >
            {message.sender !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 overflow-hidden">
                <img src="/images/nicor-logo-black-removebg_without_text.png" alt="NicorAI" className="w-full h-full object-cover" onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
                }} />
              </div>
            )}
            <div 
              className={`max-w-[75%] p-3 ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tl-xl rounded-br-xl rounded-bl-xl' 
                  : 'bg-blue-200 text-black rounded-tr-xl rounded-bl-xl rounded-br-xl'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div 
                className={`text-xs mt-1 text-right ${
                  message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 ml-2 flex-shrink-0 overflow-hidden flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex-shrink-0 overflow-hidden">
              <img src="/images/nicor-logo-black-removebg_without_text.png" alt="NicorAI" className="w-full h-full object-cover" onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
              }} />
            </div>
            <div className="bg-gray-100 rounded-tr-xl rounded-tl-xl rounded-br-xl p-3 max-w-[75%]">
              <div className="flex space-x-2 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mx-auto p-3 my-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area - fixed at bottom */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-3 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-12 min-h-12 max-h-32 placeholder-gray-500 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 ${
                isLoading ? 'opacity-50' : ''
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex-1 h-full flex flex-col">
      {(messages.length === 0 || isInitialView) ? renderInitialView() : renderChatView()}
      
      {/* Render dynamic view if available */}
      {dynamicView && (
        <DynamicContentRenderer 
          view={dynamicView} 
          onClose={handleCloseDynamicView} 
        />
      )}
    </div>
  );
};

export default Chat; 