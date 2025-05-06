// API service for NicorAI frontend
// Connects to the real API Gateway

// Configuration
const API_GATEWAY_URL = 'http://localhost:4000';
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
  type: 'chart' | 'card' | 'table' | 'custom';
  data: any;
}

// API class
class ApiService {
  private currentChatId: string | null = null;

  constructor() {
    // Initialize with the most recent chat or create a new one
    this.initializeChat();
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
    return newChatId;
  }

  // Get all chat sessions from localStorage
  getChatHistory(): ChatSession[] {
    try {
      const chatHistoryJSON = localStorage.getItem('nicoraiChatHistory');
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
    this.currentChatId = chatId;
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
      
      localStorage.setItem('nicoraiChatHistory', JSON.stringify(trimmedHistory));
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

  // Send a chat message and get a response
  async sendMessage(message: string): Promise<ChatMessage> {
    // Create the user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Add user message to current chat
    this.addMessageToCurrentChat(userMessage);
    
    try {
      // If in development mode and we want to test with mock responses,
      // uncomment the following line:
      // if (DEVELOPMENT_MODE) throw new Error('Testing fallback');
      
      // Create request payload
      const payload = {
        userId: 'user-123', // Can be dynamic in a real app
        message: message,
        timestamp: new Date().toISOString()
      };
      
      // Make the actual API call
      const response = await fetch(`${API_GATEWAY_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      // Parse the API Gateway response (format 4.3.1)
      const data = await response.json();
      
      // Check if the response has empty content
      if (!data.content?.text || data.content.text.trim() === '\n') {
        console.warn('Received empty response from API Gateway');
        
        if (DEVELOPMENT_MODE) {
          // In development, provide a mock response if the API returns empty content
          const aiMessage: ChatMessage = {
            id: data.responseId || `msg-${Date.now()}-ai`,
            content: `[MOCK CONTENT] The API returned an empty response. ${this.generateResponse(message)}`,
            sender: 'ai',
            timestamp: new Date(data.timestamp)
          };
          
          this.addMessageToCurrentChat(aiMessage);
          return aiMessage;
        }
      }
      
      // Transform the API response to the ChatMessage format
      const aiMessage: ChatMessage = {
        id: data.responseId || `msg-${Date.now()}-ai`,
        content: data.content.text,
        sender: 'ai',
        timestamp: new Date(data.timestamp)
      };
      
      // Add AI message to current chat
      this.addMessageToCurrentChat(aiMessage);
      return aiMessage;
    } catch (error) {
      console.error('Error calling API Gateway:', error);
      
      if (DEVELOPMENT_MODE) {
        // Determine error type for better debug information
        let fallbackMessage = '';
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          fallbackMessage = '[FALLBACK - CONNECTION ERROR] The API Gateway appears to be offline. ';
        } else {
          fallbackMessage = '[FALLBACK - API ERROR] ';
        }
        
        // Create a fallback AI message
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          content: `${fallbackMessage}${this.generateResponse(message)}`,
          sender: 'ai',
          timestamp: new Date()
        };
        
        // Add AI message to current chat
        this.addMessageToCurrentChat(aiMessage);
        return aiMessage;
      } else {
        // In production, rethrow the error to be handled by the component
        throw error;
      }
    }
  }

  // Add a message to the current chat session
  private addMessageToCurrentChat(message: ChatMessage) {
    if (!this.currentChatId) {
      this.createNewChat();
    }
    
    const history = this.getChatHistory();
    const currentChat = history.find(c => c.id === this.currentChatId) || {
      id: this.currentChatId as string,
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
  }
  
  // Generate a dynamic view (mock)
  async getDynamicView(viewId: string): Promise<DynamicView | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would fetch the view data from the backend
    // For now, we'll just return a mock view based on the requested ID
    if (viewId === 'chart-example') {
      return {
        id: 'chart-example',
        type: 'chart',
        data: {
          title: 'Sample Chart',
          chartType: 'bar',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          values: [12, 19, 3, 5, 2]
        }
      };
    }
    
    if (viewId === 'card-example') {
      return {
        id: 'card-example',
        type: 'card',
        data: {
          title: 'Important Information',
          content: 'This is a dynamically generated card with important information.',
          actions: [
            { label: 'Learn More', url: '#' }
          ]
        }
      };
    }
    
    return null;
  }
  
  // Private helper to generate responses for fallback mode
  private generateResponse(message: string): string {
    message = message.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! I'm the NicorAI assistant. How can I help you today?";
    }
    
    if (message.includes('help')) {
      return "I'd be happy to help! You can ask me about our AI services, schedule a demo, or get information about how our solutions can benefit your business.";
    }
    
    // Default response
    return `Thanks for your message. Our team at NicorAI specializes in building custom AI solutions to help businesses like yours. Would you like to know more about how we can assist with your specific needs?`;
  }

  // Delete a chat session
  deleteChat(chatId: string) {
    const history = this.getChatHistory();
    const filteredHistory = history.filter(c => c.id !== chatId);
    
    localStorage.setItem('nicoraiChatHistory', JSON.stringify(filteredHistory));
    
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
    localStorage.removeItem('nicoraiChatHistory');
    this.createNewChat();
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService; 