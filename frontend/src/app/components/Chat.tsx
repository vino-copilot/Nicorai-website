import React, { useState, useRef, useEffect } from 'react';
import apiService, { ChatMessage } from '../services/api';
import Image from 'next/image';
import LogoBackground from './LogoBackground';
import { useChatLoading } from '../services/ChatContext';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';


interface ChatProps {
  isVisible: boolean;
  onMessageSent?: (isClosing?: boolean) => void;
  isInitialView?: boolean;
  chatId?: string | null;
}


const Chat: React.FC<ChatProps> = ({
  isVisible,
  onMessageSent,
  isInitialView,
  chatId
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { loadingChats, setLoadingForChat } = useChatLoading();

  const faqSuggestions = [
    "How can AI help my business?",
    "What services does NicorAI offer?",
    "What are the technologies used by NicorAI?",
    "What industries do you specialize in?"
  ];

  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize to detect mobile
  useEffect(() => {
    const checkIfMobile = () => {
      // Use explicit number comparison to avoid type issues
      const windowWidth = window.innerWidth;
      setIsMobile(windowWidth < 768); // 768px is typical md breakpoint
    };

    // Initial check
    checkIfMobile();

    // Listen for window resize
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Load messages from the API service when the component mounts or chatId changes
  useEffect(() => {
    const loadMessages = () => {
      if (chatId) {
        const history = apiService.getChatHistory();
        const chat = history.find(c => c.id === chatId);
        setMessages(chat ? chat.messages : []);
      } else {
        setMessages([]);
      }
    };
    loadMessages();
    // Listen for chat change events
    const handleChatChange = (e: CustomEvent) => {
      if (e.detail.chatId === chatId) {
        // Only update if the event is for this chat
        const history = apiService.getChatHistory();
        const chat = history.find(c => c.id === chatId);
        setMessages(chat ? chat.messages : []);
      }
    };
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
  }, [chatId]);


  // Special effect to reload messages when component becomes visible (additional fix)
  useEffect(() => {
    if (isVisible) {
      // Always get fresh messages from storage when component becomes visible
      const currentMessages = apiService.getCurrentChatMessages();
      setMessages(currentMessages);

      // Log for debugging
      console.log('Chat becoming visible, loading messages:', currentMessages.length);
    }
  }, [isVisible]);


  // Listen for when isInitialView changes
  useEffect(() => {
    // Only clear messages when in initial view and there are no saved messages
    const currentMessages = apiService.getCurrentChatMessages();

    if (isInitialView) {
      if (currentMessages.length > 0) {
        // If we have existing messages, show them instead of clearing
        setMessages(currentMessages);
        console.log('Initial view with existing messages, loading them:', currentMessages.length);
      } else {
        // Only clear if we don't have any saved messages
        setMessages([]);
      }
    }
  }, [isInitialView]);


  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Focus input when chat becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);


  // Helper to check if any chat is currently loading
  const anyChatLoading = Object.values(loadingChats).some(Boolean);


  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Send a message to the API
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    // Always use the chatId prop for sending
    let chatIdAtSend = chatId;
    if (!chatIdAtSend) {
      chatIdAtSend = apiService.createNewChat();
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date()
    };

    // Update UI immediately with user message
    setMessages(prev => [...prev, userMessage]);

    // Clear input and scroll to bottom
    setInputValue('');
    scrollToBottom();

    // Set loading state
    if (chatIdAtSend) {
      setLoadingForChat(chatIdAtSend, true);
    }

    try {
      // Send message to API, always passing the chatId at send time
      const response = await apiService.sendMessage(content, chatIdAtSend);

      // Update messages with API response
      setMessages(prev => {
        // Find if the message already exists in the list
        const messageExists = prev.some(m => m.id === response.id);

        if (messageExists) {
          // Replace the existing message
          return prev.map(m => m.id === response.id ? response : m);
        } else {
          // Add the new message
          return [...prev, response];
        }
      });

      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      // Clear loading state
      if (chatIdAtSend) {
        setLoadingForChat(chatIdAtSend, false);
      }
    }
  };


  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };


  // Handle FAQ suggestion clicks
  const handleFaqClick = async (question: string) => {
    // Use the same sendMessage function for consistency
    await sendMessage(question);
  };


  // Add a utility function for safely getting message content
  const getSafeMessageContent = (message: ChatMessage | undefined): string => {
    if (!message) return "";
    return message.content !== null && message.content !== undefined ? message.content : "";
  };


  const renderInitialView = () => (
    <div className={`flex flex-col items-center justify-center h-full ${isMobile ? 'px-4' : ''}`}>
      {/* Show logo at the top for mobile view */}
      {isMobile && (
        <div className="w-full flex justify-center mt-30 mb-2">
          <img
            src="/images/nicorai-logo-black.svg"
            alt="NicorAI Logo"
            className="h-30 w-auto"
            style={{ maxWidth: '70%' }}
          />
        </div>
      )}
      {/* Show Close button if we're forced to show initial view but have messages */}
      {!isInitialView && messages.length > 0 && (
        <div className="absolute top-0 right-0 p-3">
          <button
            onClick={() => {
              // Pass true to indicate we're closing the chat
              onMessageSent?.(true);
            }}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}
      <div className={`w-full max-w-lg`}>
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome to <span className="text-blue-600 text-3xl p-1 inline-block" style={{ fontFamily: "var(--font-press-start-2p)", transform: "translateY(4px)" }}>NicorAI</span></h2>
          <p className="text-gray-700 text-xl leading-relaxed">What can I assist with you?</p>
        </div>

        {/* landing page chat input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any question..."
              className="w-full p-3 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-12 min-h-12 max-h-32 placeholder-gray-500 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={anyChatLoading}
            />
            <button
              type="submit"
              disabled={anyChatLoading}
              className={`absolute right-3 top-1/2 transform -translate-y-3/5 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 ${anyChatLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {anyChatLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Ask questions like:</p>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${isMobile ? 'pb-8' : ''}`}>
            {faqSuggestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  // First, always tell the parent component to exit initial view mode and show chat
                  if (onMessageSent) {
                    onMessageSent(false);
                  }


                  // Add a small delay to allow parent component to update first
                  setTimeout(() => {
                    // Load existing messages if any
                    const currentMessages = apiService.getCurrentChatMessages();
                    if (currentMessages.length > 0) {
                      console.log('Loading existing messages before handling FAQ:', currentMessages.length);
                      setMessages(currentMessages);
                    }

                    // Process the FAQ question
                    handleFaqClick(question);
                  }, 100); // Increased delay for better UI transition
                }}
                className="p-3 text-left text-sm rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                disabled={anyChatLoading}
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
      <div className="p-4 flex justify-end fixed top-0 right-0 z-40">
        <button
          onClick={() => onMessageSent?.(true)}
          className="p-2 rounded-full hover:bg-blue-100 transition-colors bg-white border border-gray-200 shadow-lg"
          title="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      {/* Message container with custom scrollbar styling */}
      <div className="flex-1 p-4 py-18 overflow-y-auto relative sidebar-scroll">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[85%]`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full overflow-hidden ${message.sender === 'user' ? 'ml-2' : 'mr-2'} bg-white flex items-center justify-center`}>
                    {message.sender === 'user' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white p-1 bg-blue-600 rounded-full ">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    ) : (
                      <Image
                        src="/images/nicorai-logo-black.svg"
                        alt="NicorAI"
                        className="h-6 w-6 object-contain"
                        width={24}
                        height={24}
                      />
                    )}
                  </div>
                  <div className={`${message.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-blue-100 text-gray-800 rounded-tl-none ml-0'} rounded-2xl px-4 py-3 break-words`}>
                    {message.sender === 'ai' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {getSafeMessageContent(message)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    <span className="text-xs text-black-500">{format(new Date(message.timestamp), 'hh:mm a')}</span>
                  </div>
                </div>
              </div>
            ))}
            {loadingChats[chatId || ''] && (
              <div className="flex justify-start mb-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden bg-white flex items-center justify-center">
                  <Image
                    src="/images/nicorai-logo-black.svg"
                    alt="NicorAI"
                    className="h-6 w-6 object-contain"
                    width={24}
                    height={24}
                  />
                </div>
                <div className="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Error message display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      {/* Chat input */}
      <div className="p-3">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any question..."
              className="w-full pl-4 pt-4 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-14 placeholder-gray-500 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={anyChatLoading}
            />
            <button
              type="submit"
              disabled={anyChatLoading}
              className={`absolute right-3 mb-2 bottom-3 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 ${anyChatLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {anyChatLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );


  return (
    <div className={`h-full ${isVisible ? 'flex' : 'hidden'} flex-col relative bg-white`}>
      {!isInitialView && <LogoBackground />}
      {isInitialView ? renderInitialView() : renderChatView()}
    </div>
  );
};


export default Chat;