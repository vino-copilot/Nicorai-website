// API service for NicorAI frontend
// Connects to the real API Gateway

// Configuration
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL;
const DEVELOPMENT_MODE = true; // Set to false in production

// Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}


export interface ChatSession {
  id: string;
  title: string;
  lastUpdated: Date;
  messages: ChatMessage[];
}


export interface DynamicView {
  id: string;
  type: 'dynamicScreen';
  data: any;
}


// Extend ChatMessage interface to include view information
interface ChatMessageWithView extends ChatMessage {
  dynamicView?: DynamicView;
}


// Define interface for dynamic view associations
interface ViewAssociations {
  [chatId: string]: {
    [messageId: string]: string;  // messageId -> viewId
  };
}


// API class
class ApiService {
  private currentChatId: string | null = null;
  private lastDynamicViewId: string | null = null; // Track the last view to prevent repetition


  constructor() {
    // Initialize with the most recent chat or create a new one
    this.initializeChat();
    // Restore currentChatId from localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedChatId = localStorage.getItem('nicoraiCurrentChatId');
      if (savedChatId) {
        this.currentChatId = savedChatId;
      }
    }
  }


  private initializeChat() {
    const history = this.getChatHistory();
    if (history.length > 0) {
      this.currentChatId = history[0].id; // Use the most recent chat
    } else {
      this.createNewChat();
    }
  }


  // Create a new chat session
  createNewChat(): string {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      lastUpdated: new Date(),
      messages: []
    };


    // Save to localStorage
    this.saveChatSession(newChat);
    this.currentChatId = newChatId;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nicoraiCurrentChatId', newChatId);
    }
    return newChatId;
  }


  // Get all chat sessions from localStorage
  getChatHistory(): ChatSession[] {
    try {
      let chatHistoryJSON = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        chatHistoryJSON = localStorage.getItem('nicoraiChatHistory');
      }
      if (!chatHistoryJSON) return [];

      const history = JSON.parse(chatHistoryJSON);

      // Convert string timestamps back to Date objects
      const convertedHistory = history.map((chat: any) => ({
        ...chat,
        lastUpdated: new Date(chat.lastUpdated),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));


      // Filter out empty chats (chats with no messages or just with the default title)
      return convertedHistory.filter((chat: ChatSession) =>
        chat.messages.length > 0 &&
        !(chat.title === 'New Chat' && chat.messages.length === 0)
      );
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }


  // Get messages for the current chat session
  getCurrentChatMessages(): ChatMessage[] {
    if (!this.currentChatId) return [];


    const history = this.getChatHistory();
    const currentChat = history.find(c => c.id === this.currentChatId);
    return currentChat ? currentChat.messages : [];
  }


  // Set the current active chat
  setCurrentChat(chatId: string) {
    // If chatId is empty, clear the current chat ID
    if (!chatId) {
      this.currentChatId = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('nicoraiCurrentChatId');
        // Also ensure we don't have any partial messages saved
        const chatHistory = this.getChatHistory();
        const filteredHistory = chatHistory.filter(chat => chat.messages.length > 0);
        localStorage.setItem('nicoraiChatHistory', JSON.stringify(filteredHistory));
      }
      return;
    }
    
    // Otherwise set to the provided chat ID
    this.currentChatId = chatId;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nicoraiCurrentChatId', chatId);
    }
  }


  // Get the current chat ID
  getCurrentChatId(): string | null {
    return this.currentChatId;
  }


  // Save a chat session to localStorage
  private saveChatSession(chat: ChatSession) {
    try {
      const history = this.getChatHistory();

      // Remove existing chat with the same ID if it exists
      const filteredHistory = history.filter(c => c.id !== chat.id);

      // Add the new/updated chat at the beginning (most recent)
      const updatedHistory = [chat, ...filteredHistory];

      // Keep only the last 20 chats to prevent localStorage from growing too large
      const trimmedHistory = updatedHistory.slice(0, 20);


      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nicoraiChatHistory', JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }


  // Update chat title based on first few messages
  private updateChatTitle(chatId: string, messages: ChatMessage[]) {
    if (messages.length < 2) return; // Need at least one user message and one AI response


    const userMessage = messages.find(m => m.sender === 'user');
    if (!userMessage) return;


    // Use the first user message as the title (truncated)
    const title = userMessage.content.length > 30
      ? `${userMessage.content.substring(0, 30)}...`
      : userMessage.content;


    const history = this.getChatHistory();
    const chat = history.find(c => c.id === chatId);


    if (chat && chat.title === 'New Chat') {
      const updatedChat = {
        ...chat,
        title,
        lastUpdated: new Date()
      };


      this.saveChatSession(updatedChat);
    }
  }


  // Change from private to public method
  public getUserId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      let userId = localStorage.getItem('nicoraiUserId');
      if (!userId) {
        // Generate a new user ID with uniqueness from random + timestamp
        userId = `user-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
        localStorage.setItem('nicoraiUserId', userId);
        console.log('📝 Created new user ID:', userId);
      }
      return userId;
    }
    // Fallback for SSR (though this shouldn't happen in practice)
    return `user-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
  }


  // Send a chat message and get a response
  async sendMessage(message: string, chatId?: string): Promise<ChatMessageWithView> {
    // Use the provided chatId or fall back to the currentChatId
    const targetChatId = chatId || this.currentChatId;
    if (!targetChatId) {
      // If no chatId is available, create a new chat
      const newChatId = this.createNewChat();
      this.currentChatId = newChatId;
      
      // Dispatch an event to notify components about the new chat
      if (typeof window !== 'undefined') {
        const chatChangeEvent = new CustomEvent('chatChanged', {
          detail: { chatId: newChatId, messages: [] }
        });
        window.dispatchEvent(chatChangeEvent);
      }
      
      return this.sendMessage(message, newChatId);
    }

    // Create the user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to the correct chat
    this.addMessageToCurrentChat(userMessage, targetChatId);

    // If this is the first message in a chat (or after chat was cleared),
    // dispatch an event to ensure the chat is shown
    const currentMessages = this.getCurrentChatMessages();
    if (currentMessages.length <= 1 && typeof window !== 'undefined') {
      const chatChangeEvent = new CustomEvent('chatChanged', {
        detail: { chatId: targetChatId, messages: currentMessages }
      });
      window.dispatchEvent(chatChangeEvent);
    }

    try {
      // Get user ID using our utility function
      const userId = this.getUserId();


      // Create a payload with ALL details
      const payload = {
        userId: userId, // Use our utility function
        chatId: targetChatId, // Include which chat thread this belongs to
        messageId: userMessage.id, // Include the message ID
        message: message,
        timestamp: new Date().toISOString(),
        recaptchaToken: '', // Placeholder for recaptcha token
      };
 
      // Execute reCAPTCHA and get the token
      if (typeof window !== 'undefined' && 
          typeof (window as any).grecaptcha !== 'undefined' && 
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          const token = await (window as any).grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'chat' });
          payload.recaptchaToken = token;
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          // Handle the error, perhaps by not sending the message or showing an alert
          throw new Error('reCAPTCHA verification failed.');
        }
      } else if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        console.warn('reCAPTCHA site key is set, but grecaptcha object not found. Make sure the script is loaded correctly.');
        // Depending on your requirements, you might want to prevent message sending here.
      }


      // Log request with complete details for debugging
      console.log('🚀 Sending complete message details to API Gateway:', {
        userId: payload.userId,
        chatId: payload.chatId,
        messageId: payload.messageId,
        message: payload.message,
        timestamp: payload.timestamp
      });


      // Make the actual API call
      const response = await fetch(`${API_GATEWAY_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });


      if (!response.ok) {
        throw new Error('API request failed');
      }


      const responseData = await response.json();
      console.log('API Gateway response:', responseData);

      // Create AI message from response
      let aiContent = '';
      if (responseData.responseType === 'text' && responseData.content && typeof responseData.content.text === 'string') {
        aiContent = responseData.content.text;
      } else if (responseData.responseType === 'text' && (!responseData.content || responseData.content.text === undefined)) {
        // If responseType is 'text' but content is undefined or empty, show error message
        aiContent = "I'm sorry, but I encountered an error processing your request. Please try again.";
      } else if (responseData.responseType === 'view') {
        aiContent = '';
      } else if (responseData.content && typeof responseData.content === 'string') {
        aiContent = responseData.content;
      }
      const aiMessage: ChatMessageWithView = {
        id: `msg-${Date.now()}-ai`,
        content: aiContent,
        sender: 'ai',
        timestamp: new Date()
      };


      // Check for dynamic view in response
      let dynamicView = null;
      if (responseData.responseType === 'view') {
        dynamicView = this.checkResponseForDynamicView(responseData);
      } else if (responseData.content && typeof responseData.content === 'object') {
        if (responseData.content.items && Array.isArray(responseData.content.items)) {
          dynamicView = {
            id: `dynamic-${Date.now()}`,
            type: 'custom',
            data: responseData.content
          };
        } else if (responseData.content.dynamicView || responseData.content.view) {
          const viewData = responseData.content.dynamicView || responseData.content.view;
          dynamicView = {
            id: `dynamic-${Date.now()}`,
            type: viewData.type || 'custom',
            data: viewData.data || viewData
          };
        }
      }
      if (dynamicView) {
        console.log('Dynamic view found in API response:', dynamicView);
        aiMessage.dynamicView = dynamicView;
      }
      // Add AI message to the correct chat
      this.addMessageToCurrentChat(aiMessage, targetChatId);
      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create simple error message with server down notification
      const errorMessage: ChatMessageWithView = {
        id: `msg-${Date.now()}-ai`,
        content: "I'm sorry, but I encountered an error processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      this.addMessageToCurrentChat(errorMessage, targetChatId);
      return errorMessage;
    }
  }


  // Add a message to the current chat session
  private addMessageToCurrentChat(message: ChatMessage, chatId?: string) {
    const targetChatId = chatId || this.currentChatId;
    if (!targetChatId) {
      this.createNewChat();
      return;
    }


    const history = this.getChatHistory();
    const currentChat = history.find(c => c.id === targetChatId) || {
      id: targetChatId as string,
      title: 'New Chat',
      lastUpdated: new Date(),
      messages: []
    };


    // Add the new message
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, message],
      lastUpdated: new Date()
    };


    // Save the updated chat
    this.saveChatSession(updatedChat);

    // Update chat title if this is a new chat
    this.updateChatTitle(updatedChat.id, updatedChat.messages);


    // If this is an AI message with a dynamicView, store the view association immediately
    if (message.sender === 'ai' && (message as any).dynamicView) {
      const view = (message as any).dynamicView;
      const viewId = `view-for-message-${message.id}`;
      // Store the view and association
      this.storeViewAndAssociation(message.id, { ...view, id: viewId });
    }
  }


  // Save multiple messages to the current chat session
  saveMessages(messages: ChatMessage[], chatId?: string) {
    const targetChatId = chatId || this.currentChatId;
    if (!targetChatId) {
      console.error('No target chat ID for saving messages');
      return;
    }


    const history = this.getChatHistory();
    const currentChat = history.find(c => c.id === targetChatId) || {
      id: targetChatId as string,
      title: 'New Chat',
      lastUpdated: new Date(),
      messages: []
    };


    // Replace all messages with the new set
    const updatedChat = {
      ...currentChat,
      messages: messages,
      lastUpdated: new Date()
    };


    // Save the updated chat
    this.saveChatSession(updatedChat);


    // Update chat title
    this.updateChatTitle(updatedChat.id, updatedChat.messages);


    // Process any AI messages with dynamic views
    messages.forEach(message => {
      if (message.sender === 'ai' && (message as any).dynamicView) {
        const view = (message as any).dynamicView;
        const viewId = `view-for-message-${message.id}`;
        this.storeViewAndAssociation(message.id, { ...view, id: viewId });
      }
    });
  }



  // Private helper to generate responses for fallback mode
  // This is no longer used, but kept here for reference

  // private generateResponse(message: string): string {
  //   message = message.toLowerCase();

  //   if (message.includes('hello') || message.includes('hi')) {
  //     return "Hello! I'm the NicorAI assistant. How can I help you today?";
  //   }

  //   if (message.includes('help')) {
  //     return "I'd be happy to help! You can ask me about our AI services, schedule a demo, or get information about how our solutions can benefit your business.";
  //   }

  //   // Default response
  //   return `Thanks for your message. Our team at NicorAI specializes in building custom AI solutions to help businesses like yours. Would you like to know more about how we can assist with your specific needs?`;
  // }




  // Delete a chat session
  deleteChat(chatId: string) {
    const history = this.getChatHistory();
    const filteredHistory = history.filter(c => c.id !== chatId);


    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nicoraiChatHistory', JSON.stringify(filteredHistory));
    }


    // If we deleted the current chat, set the current chat to the most recent one
    if (this.currentChatId === chatId) {
      this.currentChatId = filteredHistory.length > 0 ? filteredHistory[0].id : null;

      // If there are no chats left, create a new one
      if (!this.currentChatId) {
        this.createNewChat();
      }
    }
  }


  // Clear all chat history
  clearAllChats() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('nicoraiChatHistory');
    }
    this.createNewChat();
  }


  // Check if API response has suggested a dynamic view (for Day 6)
  async checkForDynamicView(query: string): Promise<DynamicView | null> {
    // All mock view generation is no longer supported
    // We'll only support dynamicScreen views from actual backend responses
      return null;
  }


  // Clear the tracked dynamic view (call this when closing a view)
  clearLastDynamicView() {
    this.lastDynamicViewId = null;
  }


  // Helper method to create a dynamic view from API response data
  createDynamicViewFromResponse(responseData: any): DynamicView | null {
    if (!responseData) return null;


    try {
      // For the console-visible format where responseType is 'view'
      if (responseData.responseType === 'view' && responseData.content) {
        // Only create dynamicScreen views when output string is available
        if (responseData.content.output && typeof responseData.content.output === 'string') {
        return {
          id: `dynamic-${Date.now()}`,
            type: 'dynamicScreen',
            data: responseData.content
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error creating dynamic view from response:', error);
      return null;
    }
  }


  // Update sendMessage to also check for dynamic view data in API response
  private checkResponseForDynamicView(data: any): DynamicView | null {
    if (!data || !data.responseType || data.responseType !== 'view' || !data.content) return null;
   
    try {
      // Check if we have valid output for dynamic screen
      if (data.content.output && typeof data.content.output === 'string') {
        return {
          id: `dynamic-${Date.now()}`,
          type: 'dynamicScreen',
          data: data.content
        };
      }
      return null;
    } catch (error) {
      console.error('Error checking for dynamic view in response:', error);
      return null;
    }
  }


  // Helper method to store a view and its message association
  private storeViewAndAssociation(messageId: string, view: DynamicView) {
    if (!view || !view.id || !messageId) return;
   
    try {
      // Ensure each messageId gets a unique viewId based on the message content
      // This ensures different messages get different views
      const currentChatId = this.getCurrentChatId();
      if (!currentChatId) return;
     
      // Generate a unique view ID that includes the message ID to ensure uniqueness
      const uniqueViewId = `view-for-message-${messageId}`;
     
      // Create a copy of the view with the unique ID
      const uniqueView: DynamicView = {
        ...view,
        id: uniqueViewId
      };
     
      // Store the view itself
      let storedViews: Record<string, DynamicView> = {};
      const storedViewsJson = localStorage.getItem('storedDynamicViews');
      if (storedViewsJson) {
        storedViews = JSON.parse(storedViewsJson);
      }
     
      // Store with unique ID to ensure each message has its own view
      storedViews[uniqueViewId] = uniqueView;
      localStorage.setItem('storedDynamicViews', JSON.stringify(storedViews));
     
      // Store the association
      let viewAssociations: ViewAssociations = {};
      const associationsJson = localStorage.getItem('dynamicViewAssociations');
      if (associationsJson) {
        viewAssociations = JSON.parse(associationsJson);
      }
     
      if (!viewAssociations[currentChatId]) {
        viewAssociations[currentChatId] = {};
      }
     
      // Store the association with the unique view ID
      viewAssociations[currentChatId][messageId] = uniqueViewId;
      localStorage.setItem('dynamicViewAssociations', JSON.stringify(viewAssociations));
     
      console.log(`Stored view ${uniqueViewId} for message ${messageId}`);
    } catch (e) {
      console.error('Error storing view and association:', e);
    }
  }
}


// Export a singleton instance
const apiService = new ApiService();
export default apiService;