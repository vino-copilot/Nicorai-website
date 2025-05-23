import React, { useState, useRef, useEffect } from 'react';
import apiService, { ChatMessage, DynamicView } from '../services/api';
import DynamicContentRenderer from './DynamicContentRenderer';
import Image from 'next/image';
import LogoBackground from './LogoBackground';
import { useChatLoading } from '../services/ChatContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


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
  const [error, setError] = useState<string | null>(null);
  const [dynamicView, setDynamicView] = useState<DynamicView | null>(null);
  const [internalClosedDynamicView, setInternalClosedDynamicView] = useState<DynamicView | null>(null);
  const [dynamicViewMessageId, setDynamicViewMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { loadingChats, setLoadingForChat } = useChatLoading();

  // Use either external or internal closed dynamic view
  const closedDynamicView = externalClosedDynamicView || internalClosedDynamicView;

  const faqSuggestions = [
    "How can AI help my business?",
    "What services does NicorAI offer?",
    "What are the technologies used by NicorAI?",
    "What industries do you specialize in?"
  ];

  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  // Add state for short screen height
  const [isShortScreen, setIsShortScreen] = useState(false);

  // Handle window resize to detect mobile and short screen
  useEffect(() => {
    const checkIfMobileAndShort = () => {
      const isMobileView = window.innerWidth < 768; // 768px is typical md breakpoint
      setIsMobile(isMobileView);
      setIsShortScreen(window.innerHeight < 724);
    };
   
    // Initial check
    checkIfMobileAndShort();
   
    // Listen for window resize
    window.addEventListener('resize', checkIfMobileAndShort);
   
    return () => {
      window.removeEventListener('resize', checkIfMobileAndShort);
    };
  }, []);


  // Process pending dynamic view from parent
  useEffect(() => {
    if (pendingDynamicView) {
      console.log('Received pending dynamic view:', pendingDynamicView);
      // If we have messages, associate the dynamic view with the latest AI message
      if (messages.length > 0) {
        const latestAiMessage = [...messages]
          .filter(m => m.sender === 'ai')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (latestAiMessage) {
          // Always use the consistent view ID
          const consistentViewId = `view-for-message-${latestAiMessage.id}`;
          const consistentView: DynamicView = {
            ...pendingDynamicView,
            id: consistentViewId
          };
          // Store the association and the view
          storeViewMessageAssociation(latestAiMessage.id, consistentViewId, consistentView);
          setDynamicView(consistentView);
          setDynamicViewMessageId(latestAiMessage.id);
          setInternalClosedDynamicView(null);
          return;
        }
      }
      // If no AI messages, just set the view as is (should not happen in normal flow)
      setDynamicView(pendingDynamicView);
      setInternalClosedDynamicView(null);
    }
  }, [pendingDynamicView, messages]);


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
       
      // Don't clear closed dynamic view
      if (dynamicView) {
        setDynamicView(null);
      }
       
      // Also clear the message ID association
      setDynamicViewMessageId(null);
      }
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


  // Enhanced function to check if a message has an associated dynamic view
  const messageHasAssociatedView = (messageId: string): boolean => {
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) return false;
   
    try {
      // Step 1: Check if this message has a view in memory
      if (dynamicView && dynamicViewMessageId === messageId) {
        return true;
      }

      // Step 2: Check if this message has a closed view in memory
      if (internalClosedDynamicView && dynamicViewMessageId === messageId) {
        return true;
      }

      // Step 3: Check localStorage associations
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (associationsJson) {
        const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
       
        if (viewAssociations[currentChatId] && viewAssociations[currentChatId][messageId]) {
          // Found a view ID association for this message
          const viewId = viewAssociations[currentChatId][messageId];
         
          // Verify if the view exists in storage
          const storedViewsJson = localStorage.getItem('storedDynamicViews');
          if (storedViewsJson) {
            const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
            if (storedViews[viewId]) {
              // Make sure it's a valid view
              const view = storedViews[viewId];
              return !!(view && view.id && view.type && view.data);
            }
          }
         
          // Even if we don't have the view details, we know there should be one
          return true;
        }
      }
     
      // Step 4: Check message content for view indicators
      const message = messages.find(m => m.id === messageId);
      if (message) {
        // Safety check for null/undefined content
        if (message.content === null || message.content === undefined) {
          console.log(`Message ${messageId} has null/undefined content, treating as visual content`);
          return true;
        }
       
        const lowerContent = message.content.toLowerCase();
       
        // Check for generic visual content indicators
        if (lowerContent.includes("visual content") ||
            lowerContent === "this response contains visual content." ||
            lowerContent.includes("this response contains visual content") ||
            message.content.trim() === "") {
          console.log(`Message ${messageId} content indicates it should have a view`);
          return true;
        }
      }
     
      return false;
    } catch (e) {
      console.error('Error checking message for associated view:', e);
      return false;
    }
  };


  // Function to handle sending a message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    const chatIdAtSend = apiService.getCurrentChatId();
    setInputValue('');
    setError(null);
   
    // Create a new chat if there is no current chat ID (after page refresh or explicit closing)
    let currentChatId = chatIdAtSend;
    if (!currentChatId) {
      const newChatId = apiService.createNewChat();
      apiService.setCurrentChat(newChatId);
      currentChatId = newChatId;
      
      // Dispatch an event to notify components about the new chat
      const chatChangeEvent = new CustomEvent('chatChanged', {
        detail: { chatId: newChatId, messages: [] }
      });
      window.dispatchEvent(chatChangeEvent);
    }
   
    // Ensure we have a final chat ID
    const finalChatId = apiService.getCurrentChatId() || '';
   
    // Create user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content: content,
      sender: 'user',
      timestamp: new Date()
    };
   
    // Update UI immediately with the user message
    setMessages(prevMessages => [...prevMessages, userMessage]);
   
    // Scroll to bottom to show the user message
    setTimeout(scrollToBottom, 50);
   
    // Set loading for this chat
    if (currentChatId) setLoadingForChat(currentChatId, true);
   
    try {
      // Use the API service to get a response
      console.log(`Sending message: "${content}"`);
      const chatIdForSend = apiService.getCurrentChatId() || undefined;
      const aiResponse = await apiService.sendMessage(content, chatIdForSend);
     
      // Check if response content is undefined
      if (!aiResponse || aiResponse.content === undefined) {
        setError("I'm sorry, but I encountered an error processing your request. Please try again.");
        // Ensure we update messages even with error
        const updatedMessages = apiService.getCurrentChatMessages();
        setMessages(updatedMessages);
        return;
      }

      // Get messages from API service to include both user and AI messages
      const updatedMessages = apiService.getCurrentChatMessages();
      setMessages(updatedMessages);

      // Handle dynamic view if present in the response
      if (aiResponse.dynamicView) {
        console.log('Dynamic view found in AI response:', aiResponse.dynamicView);

        // Get the ID of the latest AI message for associating with dynamic view
        const latestAiMessage = updatedMessages
          .filter(m => m.sender === 'ai')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (latestAiMessage) {
          // Always use the consistent view ID pattern
          const consistentViewId = `view-for-message-${latestAiMessage.id}`;

          // Create a copy of the view with this consistent ID
          const consistentView: DynamicView = {
            ...aiResponse.dynamicView,
            id: consistentViewId
          };

          // Store the view and its association with the message
          storeViewMessageAssociation(latestAiMessage.id, consistentViewId, consistentView);

          // Show the view
          setDynamicViewMessageId(latestAiMessage.id);
          setDynamicView(consistentView);
          setInternalClosedDynamicView(null);

          // Notify parent to hide chat and show view
          if (onMessageSent) {
            onMessageSent(true, consistentView, false);
          }
        }
      }
     
      // Scroll to the bottom again to show the AI response
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setError("I'm sorry, but I encountered an error processing your request. Please try again.");
      
      // Make sure to update the UI even when there's an error
      const updatedMessages = apiService.getCurrentChatMessages();
      setMessages(updatedMessages);
      
      // Scroll to show the error message
      setTimeout(scrollToBottom, 100);
    } finally {
      // Always clear loading state for both the original chat ID and the current one
      if (chatIdAtSend) setLoadingForChat(chatIdAtSend, false);
      
      // Also clear loading for the current chat ID if it's different
      const currentId = apiService.getCurrentChatId();
      if (currentId && currentId !== chatIdAtSend) {
        setLoadingForChat(currentId, false);
      }
    }
  };


  const anyChatLoading = Object.values(loadingChats).some(Boolean);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingChats[apiService.getCurrentChatId() || '']) return;
    sendMessage(inputValue);
  };


  const handleFaqClick = async (question: string) => {
    // Get the current chat ID or create one only if no chat exists
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) {
      const newChatId = apiService.createNewChat();
      apiService.setCurrentChat(newChatId);
    }
   
    if (loadingChats[apiService.getCurrentChatId() || '']) return;
   
    // Display user question immediately
    const userMessageId = `msg-${Date.now()}-user`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      content: question,
      sender: 'user',
      timestamp: new Date()
    };
   
    // First, load any existing messages from chat history
    const existingMessages = apiService.getCurrentChatMessages();
   
    // Add user message to the existing messages and update UI
    const updatedMessages = [...existingMessages, userMessage];
    setMessages(updatedMessages);

    // Set loading state
    const chatId = apiService.getCurrentChatId() || '';
    setLoadingForChat(chatId, true);
    
    try {
      // Send the question to the backend using the existing sendMessage function
      console.log(`Sending FAQ question: "${question}"`);
      const aiResponse = await apiService.sendMessage(question, chatId);
      
      // Get updated messages from the API service
      const latestMessages = apiService.getCurrentChatMessages();
      setMessages(latestMessages);
      
      // Handle dynamic view if present in the response
      if (aiResponse && aiResponse.dynamicView) {
        console.log('Dynamic view found in AI response:', aiResponse.dynamicView);

        // Get the ID of the latest AI message for associating with dynamic view
        const latestAiMessage = latestMessages
          .filter(m => m.sender === 'ai')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (latestAiMessage) {
          // Always use the consistent view ID pattern
          const consistentViewId = `view-for-message-${latestAiMessage.id}`;

          // Create a copy of the view with this consistent ID
          const consistentView: DynamicView = {
            ...aiResponse.dynamicView,
            id: consistentViewId
          };

          // Store the view and its association with the message
          storeViewMessageAssociation(latestAiMessage.id, consistentViewId, consistentView);

          // Show the view
          setDynamicViewMessageId(latestAiMessage.id);
          setDynamicView(consistentView);
          setInternalClosedDynamicView(null);

          // Notify parent to hide chat and show view
          if (onMessageSent) {
            onMessageSent(true, consistentView, false);
          }
        }
      }
      
      // Dispatch chat change event to ensure the chat thread opens
      const chatChangeEvent = new CustomEvent('chatChanged', {
        detail: { 
          chatId: apiService.getCurrentChatId(), 
          messages: latestMessages 
        }
      });
      window.dispatchEvent(chatChangeEvent);
      
      // Scroll to bottom after adding messages
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Error processing FAQ question:', error);
      setError("I'm sorry, but I encountered an error processing your request. Please try again.");
    } finally {
      // Clear loading state
      setLoadingForChat(chatId, false);
    }
  };


  // Enhanced function to store message-view associations in localStorage
  const storeViewMessageAssociation = (messageId: string, viewId: string, view?: DynamicView) => {
    const currentChatId = apiService.getCurrentChatId();
    if (!currentChatId) {
      console.error('No current chat ID available for storing view association');
      return;
    }
   
    console.log(`[STORE] Storing association between message ${messageId} and view ${viewId} for chat ${currentChatId}`);
    try {
      // STEP 1: Store the view itself if provided
      if (view) {
        console.log(`[STORE] Storing view with ID ${viewId}`, view);
        // Get existing stored views
        let storedViews: Record<string, DynamicView> = {};
        const storedViewsJson = localStorage.getItem('storedDynamicViews');
        if (storedViewsJson) {
          try {
            storedViews = JSON.parse(storedViewsJson);
          } catch (e) {
            console.error('[STORE] Error parsing stored views, creating new storage');
            storedViews = {};
          }
        }
        
        // Ensure the view has the correct ID
        const viewToStore = {
          ...view,
          id: viewId
        };
        
        // Store the view with its ID
        storedViews[viewId] = viewToStore;
        
        // Always also store with a direct message ID for easy retrieval
        const directViewId = `view-for-message-${messageId}`;
        storedViews[directViewId] = {
          ...viewToStore,
          id: directViewId
        };
        
        console.log(`[STORE] Also storing with direct ID ${directViewId}`);
        
        // Save to localStorage
        localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
        console.log('[STORE] Views stored:', Object.keys(storedViews).length);
      }

      // STEP 2: Store the message-view association
      let viewAssociations: ViewAssociations = {};
      try {
        const stored = localStorage.getItem('dynamicViewAssociations');
        if (stored) {
          viewAssociations = JSON.parse(stored);
        }
      } catch (e) {
        console.error('[STORE] Error parsing stored view associations', e);
        // If there's an error parsing, start fresh with empty associations
        viewAssociations = {};
      }

      // Initialize chat associations if needed
      if (!viewAssociations[currentChatId]) {
        viewAssociations[currentChatId] = {};
      }

      // Store the association
      viewAssociations[currentChatId][messageId] = viewId;
      localStorage.setItem('dynamicViewAssociations', JSON.stringify(viewAssociations));
      
      console.log(`[STORE] Successfully saved association for message ${messageId} -> view ${viewId} in chat ${currentChatId}`);
      
      // Make sure this message ID is set for future reference
      setDynamicViewMessageId(messageId);
    } catch (e) {
      console.error('[STORE] Error storing view message association:', e);
      setError("Failed to store the view. Some features may not work properly.");
    }
  };
   
  // Helper function to retrieve a stored dynamic view by ID
  const getStoredDynamicViewById = (viewId: string): DynamicView | null => {
    try {
      console.log(`[RETRIEVE] Looking for stored view with ID: ${viewId}`);
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
        console.log('[RETRIEVE] Current storedViews:', storedViews);
        if (storedViews[viewId]) {
          console.log(`[RETRIEVE] Found stored view: ${viewId}`);
          return storedViews[viewId];
        }
        if (viewId.startsWith('view-for-message-')) {
          console.log(`[RETRIEVE] Looking for message-specific view: ${viewId}`);
          return storedViews[viewId] || null;
        }
        console.log(`[RETRIEVE] View with ID ${viewId} not found in local storage`);
      } else {
        console.log('[RETRIEVE] No stored views found in localStorage');
      }
    } catch (e) {
      console.error(`[RETRIEVE] Error retrieving stored view with ID ${viewId}:`, e);
    }
    return null;
  };


  // Function to handle closing a dynamic view
  const handleCloseDynamicView = () => {
    try {
      // Store the current dynamic view before closing it
      if (!isInitialView && dynamicView) {
        // Store the current view as the closed view
        setInternalClosedDynamicView(dynamicView);
        
        // Ensure we have the message ID properly saved
        if (dynamicViewMessageId) {
          // Make sure to save this view in localStorage for the current chat
          const currentChatId = apiService.getCurrentChatId();
          if (currentChatId) {
            // This ensures the view is properly saved and can be retrieved later
            const directViewId = `view-for-message-${dynamicViewMessageId}`;
            storeViewMessageAssociation(dynamicViewMessageId, directViewId, dynamicView);
          }
        }
        
        // Log the current association for debugging
        console.log(`[DEBUG] Closing view: keeping association with message ID ${dynamicViewMessageId}`);
      
        // Also notify parent of the closed view
        if (onMessageSent) {
          onMessageSent(false, dynamicView, true);
        }
      }
    
      // Clear the dynamic view but DO NOT clear dynamicViewMessageId
      setDynamicView(null);
    } catch (error) {
      console.error('Error closing dynamic view:', error);
      // Ensure the view is cleared even if there was an error
      setDynamicView(null);
      // Notify parent
      if (onMessageSent) {
        onMessageSent(false);
      }
    }
  };


  // Function to handle clicking "Show the response" for a specific message
  const handleShowResponseClick = (messageId: string) => {
    try {
      console.log(`Looking for view associated with message ID: ${messageId}`);
      
      // First, check if this message is the one associated with the current closed view
      if (internalClosedDynamicView && dynamicViewMessageId === messageId) {
        console.log('Using internal closed view');
        showDynamicView(messageId, internalClosedDynamicView);
        return;
      }

      // If no internal closed view for this message, try the direct approach first
      // Using a consistent ID format that includes the message ID
      const directViewId = `view-for-message-${messageId}`;
      console.log(`Trying direct view ID: ${directViewId}`);
      
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        try {
          const storedViews = JSON.parse(storedViewsJson);
          if (storedViews[directViewId]) {
            console.log(`Found view directly with ID ${directViewId}`);
            showDynamicView(messageId, storedViews[directViewId]);
            return;
          }
        } catch (e) {
          console.error('Error parsing storedViews JSON:', e);
        }
      }

      // If we can't find it directly, try the association approach
      const currentChatId = apiService.getCurrentChatId();
      if (!currentChatId) {
        setError("Could not find the associated chat.");
        return;
      }

      // Get view associations from localStorage
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (!associationsJson) {
        setError("Could not find the view associations.");
        return;
      }

      const viewAssociations: ViewAssociations = JSON.parse(associationsJson);
      
      // Check if we have an association for this specific message
      if (viewAssociations[currentChatId] && viewAssociations[currentChatId][messageId]) {
        const viewId = viewAssociations[currentChatId][messageId];
        console.log(`Found view ID ${viewId} for message ${messageId} using associations`);
   
        // Get stored views from localStorage
        if (!storedViewsJson) {
          setError("Could not find the stored views.");
          return;
        }

        const storedViews: Record<string, DynamicView> = JSON.parse(storedViewsJson);
        const view = storedViews[viewId];
        
        if (!view) {
          setError("Could not find the stored view.");
          return;
        }

        // Show the dynamic view
        showDynamicView(messageId, view);
        return;
      }

      // If we get here, we couldn't find a view for this message
      setError("Could not find a view for this message.");
    } catch (e) {
      console.error('Error retrieving view for message:', e);
      setError("Sorry, there was an error retrieving the view.");
    }
  };
  
  // Simplified function to display dynamic view
  const showDynamicView = (messageId: string, view: DynamicView) => {
    console.log(`[DEBUG] Showing dynamic view ${view.id} for message ${messageId}`);
   
    // Set the messageId for when we return to chat
    setDynamicViewMessageId(messageId);
    console.log(`[DEBUG] Set dynamicViewMessageId to ${messageId}`);
   
    // Set the dynamic view
    setDynamicView(view);
   
    // Clear any internal closed view since we're showing it now
    setInternalClosedDynamicView(null);
   
    // Notify parent to hide chat and display the view in full-screen
    if (onMessageSent) {
      onMessageSent(true, view, false);
    }
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
       
        {/* Render dynamic view in initial view if available */}
        {dynamicView && (
          <div className="mb-8">
            <div className="flex justify-start mb-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden bg-white flex items-center justify-center">
                <img
                  src="/images/nicorai-logo-black.svg"
                  alt="NicorAI"
                  className="h-6 w-6 object-contain"
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
        {/* landing page chat input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any question about NicorAI.."
              className="w-full p-5 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none h-16 placeholder-gray-500 text-gray-900 placeholder:whitespace-nowrap   "
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
        {!dynamicView && (
          <button
            onClick={() => onMessageSent?.(true)}
            className="p-2 rounded-full hover:bg-blue-100 transition-colors bg-white border border-gray-200 shadow-lg"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
      {/* Message container with custom scrollbar styling */}
      <div className="flex-1 p-4 py-18 overflow-y-auto relative sidebar-scroll">
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
                <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src="/images/nicorai-logo-black.svg"
                    alt="NicorAI"
                    className="h-6 w-6 object-contain"
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
                  {/* If AI message content is empty but has a view, show a placeholder message */}
                  {message.sender === 'ai' && (!getSafeMessageContent(message) || getSafeMessageContent(message).trim() === '') ? (
                    <p className="italic text-gray-600 mb-2">This response contains visual content.</p>
                  ) : message.sender === 'ai' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {getSafeMessageContent(message)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    getSafeMessageContent(message)
                  )}
                 
                  {/* Show "Show the response" button for any message that has an associated view */}
                  {message.sender === 'ai' && !dynamicView && messageHasAssociatedView(message.id) && (
                    <div className="dynamic-view-button mt-2">
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
        {loadingChats[apiService.getCurrentChatId() || ''] && (
          <div className="flex justify-start mb-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden bg-white flex items-center justify-center">
              <img
                src="/images/nicorai-logo-black.svg"
                alt="NicorAI"
                className="h-6 w-6 object-contain"
              />
            </div>
            <div className="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center max-w-[80%]">
              {/* <span className="text-gray-600 mr-2">Thinking</span> */}
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        {/* Error message */}
        {error && (
          <div className="flex justify-start mb-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full mr-1 overflow-hidden bg-white flex items-center justify-center">
              <img
                src="/images/nicorai-logo-black.svg"
                alt="NicorAI"
                className="h-6 w-6 object-contain"
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
      <div className="p-3">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask any question about NicorAI.."
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


  if (!isVisible) {
    return null;
  }


  return (
    <div
      className={`flex-1 h-full flex flex-col relative ${isShortScreen ? 'overflow-y-auto' : ''} ${isShortScreen ? 'scrollbar-none' : ''}`}
      style={isShortScreen ? { maxHeight: '100vh', scrollbarWidth: 'none', msOverflowStyle: 'none', ...(({
        '::-webkit-scrollbar': { display: 'none' }
      })) } : {}}
    >
      {/* Only show LogoBackground in chat view, not in initial/welcome view */}
      {!(messages.length === 0 || isInitialView) && <LogoBackground />}
      {(messages.length === 0 || isInitialView) ? renderInitialView() : renderChatView()}
    </div>
  );
};

export default Chat;