// API service for NicorAI frontend
// Connects to the real API Gateway

// Configuration
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL ;

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


// API class
class ApiService {
  private currentChatId: string | null = null;
  private apiAvailable: boolean = true; // Track API availability
  private recaptchaVerifiedChats: Set<string> = new Set(); // Track chats with verified reCAPTCHA


  constructor() {
    this.initializeChat();
    this.checkApiAvailability();
  }


  // Check if API is available
  private async checkApiAvailability() {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Short timeout to quickly determine if API is available
        signal: AbortSignal.timeout(3000)
      });
      
      this.apiAvailable = response.ok;
      console.log(`API availability check: ${this.apiAvailable ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      console.warn('API appears to be unavailable:', error);
      this.apiAvailable = false;
    }
  }


  private initializeChat() {
    if (typeof window !== 'undefined') {
      // Check if there is an existing chat history
      const history = this.getChatHistory();
      
      if (history.length > 0) {
        // Use the most recent chat as the current chat
        this.currentChatId = history[0].id;
      } else {
        // Do not create a new chat automatically
        this.currentChatId = null;
      }
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
    
    // Save the new chat to history
    const history = this.getChatHistory();
    history.unshift(newChat);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nicoraiChatHistory', JSON.stringify(history));
    }
    
    // Set as current chat
    this.currentChatId = newChatId;
    
    return newChatId;
  }


  // Get all chat sessions from localStorage
  getChatHistory(): ChatSession[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const historyJson = localStorage.getItem('nicoraiChatHistory');
      
      if (historyJson) {
        try {
          const history: ChatSession[] = JSON.parse(historyJson);
          
          // Convert string dates back to Date objects
          return history.map(chat => ({
            ...chat,
            lastUpdated: new Date(chat.lastUpdated),
            messages: chat.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
        } catch (error) {
          console.error('Error parsing chat history:', error);
          return [];
        }
      }
    }
    
    return [];
  }


  // Get messages for the current chat session
  getCurrentChatMessages(): ChatMessage[] {
    const history = this.getChatHistory();
    const currentChat = history.find(chat => chat.id === this.currentChatId);
    
    if (currentChat) {
      return currentChat.messages;
    }
    
    return [];
  }


  // Set the current active chat
  setCurrentChat(chatId: string) {
    // If the chat ID is empty, clear the current chat ID
    if (!chatId) {
      this.currentChatId = null;
      return;
    }
    
    // Check if the chat exists in history
    const history = this.getChatHistory();
    const chatExists = history.some(chat => chat.id === chatId);
    
    if (chatExists) {
      this.currentChatId = chatId;
      
      // Update the chat's lastUpdated timestamp
      this.updateChatTimestamp(chatId);
    } else {
      console.error(`Chat with ID ${chatId} not found in history`);
    }
  }


  // Get the current chat ID
  getCurrentChatId(): string | null {
    return this.currentChatId;
  }


  // Save a chat session to localStorage
  private saveChatSession(chat: ChatSession) {
    const history = this.getChatHistory();
    
    // Find the index of the chat in history
    const chatIndex = history.findIndex(c => c.id === chat.id);
    
    if (chatIndex !== -1) {
      // Update existing chat
      history[chatIndex] = chat;
    } else {
      // Add new chat to the beginning of the history
      history.unshift(chat);
    }
    
    // Sort history by lastUpdated (newest first)
    history.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    
    // Save to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('nicoraiChatHistory', JSON.stringify(history));
    }
  }


  private updateChatTimestamp(chatId: string) {
    const history = this.getChatHistory();
    const chatIndex = history.findIndex(c => c.id === chatId);
    
    if (chatIndex !== -1) {
      history[chatIndex].lastUpdated = new Date();
      
      // Sort history by lastUpdated (newest first)
      history.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      
      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nicoraiChatHistory', JSON.stringify(history));
      }
    }
  }


  // Update chat title based on first few messages
  private updateChatTitle(chatId: string, messages: ChatMessage[]) {
    // Find the first user message to use as the title
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    
    if (!firstUserMessage) return;
    
    const history = this.getChatHistory();
    const chatIndex = history.findIndex(c => c.id === chatId);
    
    if (chatIndex !== -1) {
      // Create a title from the first user message (max 30 chars)
      let title = firstUserMessage.content.trim();
      
      // Truncate to 30 chars and add ellipsis if needed
      if (title.length > 30) {
        title = title.substring(0, 27) + '...';
      }
      
      // Update the chat title
      history[chatIndex].title = title;
      
      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nicoraiChatHistory', JSON.stringify(history));
      }
    }
  }


  // Change from private to public method
  public getUserId(): string {
    // Check if we already have a user ID in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = localStorage.getItem('nicoraiUserId');
      
      if (userId) {
        return userId;
      }
      
      // Generate a new user ID
      const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('nicoraiUserId', newUserId);
      
      return newUserId;
    }
    
    // Fallback for SSR
    return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }


  // Send a chat message and get a response
  async sendMessage(message: string, chatId?: string): Promise<ChatMessage> {
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
 
      // Prepare recaptchaToken only for the first message in a chat
      let recaptchaToken = '';
      const chatKey = targetChatId || 'default-chat';
      // Only skip token if we've already confirmed backend accepted the first message
      const shouldSkipRecaptcha = this.recaptchaVerifiedChats.has(chatKey);
      if (!shouldSkipRecaptcha) {
        if (
          typeof window !== 'undefined' &&
          typeof (window as unknown as { grecaptcha: unknown }).grecaptcha !== 'undefined' &&
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
        ) {
          try {
            recaptchaToken = await (window as unknown as { grecaptcha: { execute: (siteKey: string, options: { action: string }) => Promise<string> } }).grecaptcha.execute(
              process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
              { action: 'chat' }
            );
          } catch (error) {
            console.error('reCAPTCHA execution failed:', error);
            throw new Error('reCAPTCHA verification failed. Please try again.');
          }
        }
      }
 
      // Create a payload with ALL details
      const payload = {
        userId: userId, // Use our utility function
        chatId: targetChatId, // Include which chat thread this belongs to
        messageId: userMessage.id, // Include the message ID
        message: message,
        timestamp: new Date().toISOString(),
        recaptchaToken: recaptchaToken, // Only present for first message in chat
      };
 
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
      } else if (responseData.content && typeof responseData.content === 'string') {
        aiContent = responseData.content;
      }
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        content: aiContent,
        sender: 'ai',
        timestamp: new Date()
      };
 
      // Add AI message to the correct chat
      this.addMessageToCurrentChat(aiMessage, targetChatId);
 
      // After first successful message, mark chat as recaptcha-verified
      if (!shouldSkipRecaptcha) {
        this.recaptchaVerifiedChats.add(chatKey);
      }
      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
     
      // Create simple error message with server down notification
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        content: "I'm sorry, but I encountered an error processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      this.addMessageToCurrentChat(errorMessage, targetChatId);
      return errorMessage;
    }
  }


  // Generate a fallback response when the API is unavailable
  private generateFallbackResponse(message: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    // Simple pattern matching for common queries
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
      return "Hello! I'm the NicorAI assistant. I'm currently operating in offline mode due to connection issues. How can I help you today?";
    }
    
    if (lowercaseMessage.includes('help')) {
      return "I'd be happy to help! However, I'm currently operating in offline mode due to connection issues. You can ask me about our AI services, but for the most up-to-date information, please try again later when our connection is restored.";
    }
    
    if (lowercaseMessage.includes('what') && lowercaseMessage.includes('do')) {
      return "NicorAI specializes in building custom AI solutions for businesses. Our services include AI consulting, development of machine learning models, and implementation of AI-powered systems. For more detailed information, please try again later when our connection to the server is restored.";
    }
    
    // Default response
    return "I'm currently operating in offline mode due to connection issues. Your message has been saved, and we'll process it once the connection is restored. Thank you for your patience.";
  }


  private addMessageToCurrentChat(message: ChatMessage, chatId?: string) {
    const targetChatId = chatId || this.currentChatId;
    
    if (!targetChatId) {
      console.error('No target chat ID for adding message');
      return;
    }
    
    const history = this.getChatHistory();
    const currentChatIndex = history.findIndex(c => c.id === targetChatId);
    
    if (currentChatIndex === -1) {
      // Create a new chat if it doesn't exist
      const newChat: ChatSession = {
        id: targetChatId,
        title: 'New Chat',
        lastUpdated: new Date(),
        messages: [message]
      };
      
      history.unshift(newChat);
      this.saveChatSession(newChat);
    } else {
      // Add message to existing chat
      history[currentChatIndex].messages.push(message);
      history[currentChatIndex].lastUpdated = new Date();
      
      // Sort history by lastUpdated (newest first)
      history.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      
      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nicoraiChatHistory', JSON.stringify(history));
      }
      
      // Update chat title if this is a new chat
      if (history[currentChatIndex].messages.length <= 2) {
        this.updateChatTitle(targetChatId, history[currentChatIndex].messages);
      }
    }
    
    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      const chatChangeEvent = new CustomEvent('chatChanged', {
        detail: {
          chatId: targetChatId,
          messages: history.find(c => c.id === targetChatId)?.messages || []
        }
      });
      
      window.dispatchEvent(chatChangeEvent);
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
  }


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

      // Do not create a new chat automatically
    }
  }


  // Clear all chat history
  clearAllChats() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('nicoraiChatHistory');
    }
    // Do not create a new chat automatically
    this.currentChatId = null;
  }
}


// Export a singleton instance
const apiService = new ApiService();
export default apiService;