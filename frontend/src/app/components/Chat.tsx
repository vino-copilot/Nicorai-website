import React, { useState, useRef, useEffect } from 'react';
import apiService, { ChatMessage, DynamicView } from '../services/api';
import DynamicContentRenderer from './DynamicContentRenderer';
import Image from 'next/image';

// Define interface for dynamic view associations
interface ViewAssociations {
  [chatId: string]: {
    [messageId: string]: string;  // messageId -> viewId
  };
}

interface ChatProps {
  isVisible: boolean;
  onMessageSent?: (isClosing?: boolean, dynamicView?: DynamicView, isClosed?: boolean) => void;
  isInitialView?: boolean;
  activeView?: string | null;
  pendingDynamicView?: DynamicView | null;
  closedDynamicView?: DynamicView | null;
}

const Chat: React.FC<ChatProps> = ({ 
  isVisible, 
  onMessageSent, 
  isInitialView, 
  activeView, 
  pendingDynamicView,
  closedDynamicView: externalClosedDynamicView
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicView, setDynamicView] = useState<DynamicView | null>(null);
  const [internalClosedDynamicView, setInternalClosedDynamicView] = useState<DynamicView | null>(null);
  const [dynamicViewMessageId, setDynamicViewMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use either external or internal closed dynamic view
  const closedDynamicView = externalClosedDynamicView || internalClosedDynamicView;

  const faqSuggestions = [
    "How can AI help my business?",
    "What services does NicorAI offer?",
    "Show me a comparison of your products",
    "What industries do you specialize in?"
  ];

  // Process pending dynamic view from parent
  useEffect(() => {
    if (pendingDynamicView) {
      console.log('Received pending dynamic view:', pendingDynamicView);
      setDynamicView(pendingDynamicView);
      // Clear internal closed view when a new pending view arrives
      setInternalClosedDynamicView(null);
      
      // If we have messages, associate the dynamic view with the latest AI message
      if (messages.length > 0) {
        const latestAiMessage = [...messages]
          .filter(m => m.sender === 'ai')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (latestAiMessage) {
          setDynamicViewMessageId(latestAiMessage.id);
        }
      }
    }
  }, [pendingDynamicView]);

  // Update internal state when external closed view changes
  useEffect(() => {
    if (externalClosedDynamicView) {
      setInternalClosedDynamicView(null);
    }
  }, [externalClosedDynamicView]);

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
      console.log('Chat change event received:', e.detail);
      // Always reload messages from the API service
      const updatedMessages = apiService.getCurrentChatMessages();
      setMessages(updatedMessages);
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

  // Special effect to reload messages when component becomes visible (additional fix)
  useEffect(() => {
    if (isVisible) {
      const currentMessages = apiService.getCurrentChatMessages();
      setMessages(currentMessages);
    }
  }, [isVisible]);

  // Listen for when isInitialView changes
  useEffect(() => {
    // If we're returning to the initial view, clear the messages
    // so we treat it as a new chat
    if (isInitialView) {
      setMessages([]);
      // Don't clear closed dynamic view
      if (dynamicView) {
        setDynamicView(null);
      }
      // Also clear the message ID association
      setDynamicViewMessageId(null);
    }
  }, [isInitialView]);

  // Always reload messages when the current chat ID changes
  useEffect(() => {
    const currentMessages = apiService.getCurrentChatMessages();
    setMessages(currentMessages);
  }, [apiService.getCurrentChatId()]);

  // Load externally stored dynamic views on mount
  useEffect(() => {
    // Try to load stored views from localStorage
    try {
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
        
        // If we have a closedDynamicView from props but no internal one, check if it's stored
        if (externalClosedDynamicView && !internalClosedDynamicView) {
          // Already have external view, no need to load from storage
          return;
        }
        
        // Check if we have associations for the current chat
        const currentChatId = apiService.getCurrentChatId();
        if (currentChatId) {
          const associationsJson = localStorage.getItem('dynamicViewAssociations');
          if (associationsJson) {
            const associations: ViewAssociations = JSON.parse(associationsJson);
            
            if (associations[currentChatId]) {
              // We have associations for this chat
              const messageIds = Object.keys(associations[currentChatId]);
              
              if (messageIds.length > 0) {
                // Find the first stored view association
                const viewId = associations[currentChatId][messageIds[0]];
                const view = storedViews[viewId];
                
                if (view && !internalClosedDynamicView) {
                  // Set as internal closed view
                  setInternalClosedDynamicView(view);
                  setDynamicViewMessageId(messageIds[0]);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error loading stored dynamic views', e);
    }
  }, []);
  
  // Enhanced useEffect to properly restore message-view associations
  useEffect(() => {
    // Skip if we're in initial view or there are no messages
    if (isInitialView || messages.length === 0) return;
    
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return;
    
    try {
      // Load message-view associations from localStorage
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (!associationsJson) return;
      
      const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
      if (!viewAssociations[currentChatId]) return;
      
      // Load stored dynamic views
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (!storedViewsJson) return;
      
      const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);

      // For each message in the current chat, check if it has a closed view association
      for (const message of messages) {
        // Only check AI messages
        if (message.sender !== 'ai') continue;
        
        if (viewAssociations[currentChatId][message.id]) {
          // This message had a dynamic view that was closed
          const viewId = viewAssociations[currentChatId][message.id];
          const view = storedViews[viewId];
          
          if (view && !dynamicView) {
            // We found a stored view for this message - set it as closed view if we don't have one
            if (!internalClosedDynamicView) {
              setInternalClosedDynamicView(view);
            }
            
            // Set the message ID to show the "Show the response" button
            setDynamicViewMessageId(message.id);
          }
        }
      }
    } catch (e) {
      console.error('Error loading stored view associations', e);
    }
  }, [messages, apiService.getCurrentChatId(), isInitialView, dynamicView]);

  // Store dynamic view in localStorage whenever it changes
  useEffect(() => {
    if (dynamicView) {
      try {
        // Get existing stored views
        let storedViews: Record<string, DynamicView> = {};
        const storedViewsJson = localStorage.getItem('storedDynamicViews');
        if (storedViewsJson) {
          storedViews = JSON.parse(storedViewsJson);
        }
        
        // Add or update the current view
        storedViews[dynamicView.id] = dynamicView;
        
        // Save back to localStorage
        localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
      } catch (e) {
        console.error('Error storing dynamic view', e);
      }
    }
  }, [dynamicView]);

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
    
    // Always create and set a new chat if there are no messages (new view or new chat)
    if (messages.length === 0) {
      const newChatId = apiService.createNewChat();
      apiService.setCurrentChat(newChatId);
    }
    
    // Clear any previous dynamic view when sending a new message
    // Only keep it if the new message specifically requests a view
    const lowerContent = content.toLowerCase().trim();
    const isViewRequest = 
      lowerContent.includes('contact') ||
      lowerContent.includes('comparison') || 
      lowerContent.includes('products') ||
      lowerContent.includes('chart') || 
      lowerContent.includes('table') ||
      lowerContent.includes('about nicor') ||
      lowerContent.includes('show');
      
    if (!isViewRequest) {
      setDynamicView(null);
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
    let newMessages: ChatMessage[] = [];
    setMessages(prevMessages => {
      // Remove any pending user message with the same content to avoid duplicates
      const filtered = prevMessages.filter(m => m.sender !== 'user' || m.content !== content);
      newMessages = [...filtered, userMessage];
      return newMessages;
    });
    
    try {
      // Use the API service to get a response
      const aiResponse = await apiService.sendMessage(content);
      
      // Update messages with both user message and AI response
      const updatedMessages = apiService.getCurrentChatMessages();
      setMessages(updatedMessages);

      // Get the ID of the latest AI message for associating with dynamic view
      const latestAiMessage = updatedMessages
        .filter(m => m.sender === 'ai')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      // First check if the API response already includes a dynamic view
      if (aiResponse.dynamicView) {
        console.log('Dynamic view found in API response:', aiResponse.dynamicView);
        setDynamicView(aiResponse.dynamicView);
        // Store the message ID associated with this dynamic view
        if (latestAiMessage) {
          setDynamicViewMessageId(latestAiMessage.id);
          
          // Store association in localStorage
          storeViewMessageAssociation(latestAiMessage.id, aiResponse.dynamicView.id);
        }
        return;
      }

      // Check API response for a dynamic view indicator 
      // Only do this if the message seems to be requesting a view
      if (isViewRequest) {
        const apiSuggestedView = await apiService.checkForDynamicView(content);
        if (apiSuggestedView) {
          setDynamicView(apiSuggestedView);
          // Store the message ID associated with this dynamic view
          if (latestAiMessage) {
            setDynamicViewMessageId(latestAiMessage.id);
            
            // Store association in localStorage
            storeViewMessageAssociation(latestAiMessage.id, apiSuggestedView.id);
          }
          return;
        }

        // Fallback to keyword detection for MVP - only for view requests
        if (lowerContent.includes('table') || 
            lowerContent.includes('comparison') || 
            lowerContent.includes('compare') || 
            lowerContent.includes('products') ||
            lowerContent.includes('pricing')) {
          const view = await apiService.getDynamicView('table-example');
          if (view) {
            setDynamicView(view);
            // Store the message ID associated with this dynamic view
            if (latestAiMessage) {
              setDynamicViewMessageId(latestAiMessage.id);
              
              // Store association in localStorage
              storeViewMessageAssociation(latestAiMessage.id, view.id);
            }
          }
        } 
        else if (lowerContent.includes('contact') || 
                lowerContent.includes('connect') || 
                lowerContent.includes('email') || 
                lowerContent.includes('phone') ||
                lowerContent.includes('reach')) {
          const view = await apiService.getDynamicView('contact-info');
          if (view) {
            setDynamicView(view);
            // Store the message ID associated with this dynamic view
            if (latestAiMessage) {
              setDynamicViewMessageId(latestAiMessage.id);
              
              // Store association in localStorage
              storeViewMessageAssociation(latestAiMessage.id, view.id);
            }
          }
        }
        else if (lowerContent.includes('chart') || 
                lowerContent.includes('graph') || 
                lowerContent.includes('performance') || 
                lowerContent.includes('report')) {
          const view = await apiService.getDynamicView('chart-example');
          if (view) {
            setDynamicView(view);
            // Store the message ID associated with this dynamic view
            if (latestAiMessage) {
              setDynamicViewMessageId(latestAiMessage.id);
              
              // Store association in localStorage
              storeViewMessageAssociation(latestAiMessage.id, view.id);
            }
          }
        }
        else if (lowerContent.includes('info') || 
                lowerContent.includes('services') || 
                lowerContent.includes('about') || 
                lowerContent.includes('details')) {
          const view = await apiService.getDynamicView('card-example');
          if (view) {
            setDynamicView(view);
            // Store the message ID associated with this dynamic view
            if (latestAiMessage) {
              setDynamicViewMessageId(latestAiMessage.id);
              
              // Store association in localStorage
              storeViewMessageAssociation(latestAiMessage.id, view.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setError("Sorry, we're having trouble connecting to the AI. Please try again.");
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
      const newChatId = apiService.createNewChat();
      apiService.setCurrentChat(newChatId);
    }
    
    sendMessage(question);
  };

  // Helper function to store message-view associations in localStorage
  const storeViewMessageAssociation = (messageId: string, viewId: string) => {
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return;
    
    // Get existing associations or initialize new object
    let viewAssociations: ViewAssociations = {};
    try {
      const stored = localStorage.getItem('dynamicViewAssociations');
      if (stored) {
        viewAssociations = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing stored view associations', e);
    }
    
    // Update associations for current chat
    if (!viewAssociations[currentChatId]) {
      viewAssociations[currentChatId] = {};
    }
    
    // Store the association: message ID -> view ID
    viewAssociations[currentChatId][messageId] = viewId;
    
    // Save back to localStorage
    localStorage.setItem('dynamicViewAssociations', JSON.stringify(viewAssociations));
    
    // Also store the dynamic view itself if it's not already stored
    if (dynamicView) {
      try {
        // Get existing stored views
        let storedViews: Record<string, DynamicView> = {};
        const storedViewsJson = localStorage.getItem('storedDynamicViews');
        if (storedViewsJson) {
          storedViews = JSON.parse(storedViewsJson);
        }
        
        // Add current view if not already stored
        if (!storedViews[dynamicView.id]) {
          storedViews[dynamicView.id] = dynamicView;
          localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
        }
      } catch (e) {
        console.error('Error storing dynamic view', e);
      }
    }
  };

  // Function to handle closing a dynamic view
  const handleCloseDynamicView = () => {
    // Only store closed view if we're in chat view (not initial view)
    if (!isInitialView) {
      // Store the current dynamic view before closing it
      setInternalClosedDynamicView(dynamicView);
      
      // Check if we already have a message ID associated with this view
      // If not, find the latest AI message to associate with
      if (!dynamicViewMessageId) {
        const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
        if (lastAiMessage && dynamicView) {
          setDynamicViewMessageId(lastAiMessage.id);
          
          // Store the association in localStorage (using our helper)
          storeViewMessageAssociation(lastAiMessage.id, dynamicView.id);
          
          // Store the view itself in localStorage
          try {
            let storedViews: Record<string, DynamicView> = {};
            const storedViewsJson = localStorage.getItem('storedDynamicViews');
            if (storedViewsJson) {
              storedViews = JSON.parse(storedViewsJson);
            }
            
            // Add current view
            storedViews[dynamicView.id] = dynamicView;
            localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
          } catch (e) {
            console.error('Error storing dynamic view', e);
          }
        }
      }
      // If we already have a message ID, keep using it - don't reassign to a new message
      
      // Also notify parent of the closed view
      if (onMessageSent && dynamicView) {
        onMessageSent(false, dynamicView, true);
      }
    }
    
    setDynamicView(null);
  };
  
  // Helper function to retrieve a stored dynamic view by ID
  const getStoredDynamicViewById = (viewId: string): DynamicView | null => {
    try {
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
        return storedViews[viewId] || null;
      }
    } catch (e) {
      console.error('Error retrieving stored view', e);
    }
    return null;
  };

  // Function to handle clicking "Show the response" for a specific message
  const handleShowResponseClick = (messageId: string) => {
    // Get the view ID from the association table
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return;
    
    try {
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (associationsJson) {
        const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
        if (viewAssociations[currentChatId] && viewAssociations[currentChatId][messageId]) {
          // We found the view ID for this message
          const viewId = viewAssociations[currentChatId][messageId];
          
          // Try to get the stored view
          const storedView = getStoredDynamicViewById(viewId);
          
          if (storedView) {
            // Set this specific view
            setDynamicView(storedView);
            setDynamicViewMessageId(messageId);
            setInternalClosedDynamicView(null);
            
            // Notify parent if needed
            if (onMessageSent) {
              onMessageSent(false, storedView, false);
            }
            return;
          }
        }
      }
      
      // If we got here, something went wrong - fall back to setting the ID and calling fallback
      console.log("Couldn't find specific view, falling back to default behavior");
      
      // Fall back to using the closedDynamicView if available
      if (closedDynamicView) {
        setDynamicView(closedDynamicView);
        setDynamicViewMessageId(messageId);
        setInternalClosedDynamicView(null);
        
        // Notify parent
        if (onMessageSent) {
          onMessageSent(false, closedDynamicView, false);
        }
      }
    } catch (e) {
      console.error('Error retrieving specific view for message', e);
      // Fall back to the closedDynamicView if available
      if (closedDynamicView) {
        setDynamicView(closedDynamicView);
        setDynamicViewMessageId(messageId);
        setInternalClosedDynamicView(null);
        
        // Notify parent
        if (onMessageSent) {
          onMessageSent(false, closedDynamicView, false);
        }
      }
    }
  };

  // Function to check if a message has an associated dynamic view
  const messageHasAssociatedView = (messageId: string): boolean => {
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return false;
    
    try {
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (!associationsJson) return false;
      
      const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
      if (!viewAssociations[currentChatId]) return false;
      
      // Check if this message has an associated view ID
      const viewId = viewAssociations[currentChatId][messageId];
      if (!viewId) return false;
      
      // Additionally, check if this view actually exists in storage
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (!storedViewsJson) return false;
      
      const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
      
      // Only return true if we actually have the stored view
      return !!storedViews[viewId];
    } catch (e) {
      console.error('Error checking message associations', e);
      return false;
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
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome to <span className="text-blue-600">NicorAI</span> Assistant</h2>
          <p className="text-gray-700 text-xl">How can I help you today?</p>
        </div>
        
        {/* Render dynamic view in initial view if available */}
        {dynamicView && (
          <div className="mb-8">
            <div className="flex justify-start mb-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
                <img 
                  src="/nicor-ai-avatar.png" 
                  alt="NicorAI" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="w-full max-w-[80%]">
                <DynamicContentRenderer 
                  view={dynamicView} 
                  onClose={handleCloseDynamicView} 
                />
                <div className="text-xs text-gray-500 mt-1 text-left">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-9 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-25 placeholder-gray-500 text-gray-900 sidebar-scroll"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
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
      <div className="p-2 flex justify-end">
        {!dynamicView && (
          <button 
            onClick={() => onMessageSent?.(true)}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors bg-blue-200"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
      {/* Message container - adding sidebar-scroll class */}
      <div className="flex-1 p-4 overflow-y-auto sidebar-scroll relative">
        {/* Always show dynamic view on top when available, regardless of sidebar state */}
        {dynamicView && (
          <div className={`absolute inset-0 z-30 flex items-center justify-center bg-white bg-opacity-80 p-4 ${activeView ? 'sticky top-0' : ''}`}>
            <div className="w-full h-full flex items-center justify-center">
              <DynamicContentRenderer 
                view={dynamicView} 
                onClose={handleCloseDynamicView} 
              />
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* AI Avatar - only show for AI messages */}
              {message.sender !== 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
                  <img 
                    src="/nicor-ai-avatar.png" 
                    alt="NicorAI" 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col">
                <div 
                  className={`rounded-2xl px-4 py-3 break-words whitespace-pre-line max-w-[80vw] md:max-w-2xl ml-auto ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-blue-100 text-gray-800 rounded-tl-none ml-0'
                  }`}
                >
                  {message.content}
                  
                  {/* Show "Show the response" button for any message that has an associated view */}
                  {message.sender === 'ai' && !dynamicView && messageHasAssociatedView(message.id) && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button 
                        onClick={() => handleShowResponseClick(message.id)}
                        className="text-blue-700 font-medium hover:underline flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                        Show the response
                      </button>
                    </div>
                  )}
                </div>
                {/* Timestamp */}
                <div 
                  className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {/* User Avatar - only show for user messages */}
              {message.sender === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full ml-1 bg-blue-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
              <img 
                src="/nicor-ai-avatar.png" 
                alt="NicorAI" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        {/* Error message */}
        {error && (
          <div className="flex justify-start mb-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden">
              <img 
                src="/nicor-ai-avatar.png" 
                alt="NicorAI" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col max-w-[80%]">
              <div className="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 text-red-700">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-medium">Connection Error</p>
                </div>
                <p className="text-sm">{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm text-red-800"
                >
                  Dismiss
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-left">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </div>
            </div>
          </div>
        )}
        {/* Remove inline dynamic view rendering here */}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area - Updated to match the initial view styling */}
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any question about NicorAi..."
              className="w-full p-4 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-14 placeholder-gray-500 text-gray-900 sidebar-scroll"
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? (
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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex-1 h-full flex flex-col">
      {(messages.length === 0 || isInitialView) ? renderInitialView() : renderChatView()}
    </div>
  );
};

export default Chat; 