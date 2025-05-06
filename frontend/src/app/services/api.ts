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

// Extend ChatMessage interface to include view information
interface ChatMessageWithView extends ChatMessage {
  dynamicView?: DynamicView;
}

// API class
class ApiService {
  private currentChatId: string | null = null;
  private lastDynamicViewId: string | null = null; // Track the last view to prevent repetition

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
  async sendMessage(message: string): Promise<ChatMessageWithView> {
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
      // Create request payload
      const payload = {
        userId: 'user-123', // Can be dynamic in a real app
        message: message,
        timestamp: new Date().toISOString()
      };
      
      // Log request for debugging
      console.log('Sending request to API Gateway:', payload);
      
      // Make the actual API call
      const response = await fetch(`${API_GATEWAY_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('API Gateway response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      // Parse the API Gateway response (format 4.3.1)
      let data;
      const responseText = await response.text();
      console.log('API Gateway raw response:', responseText);
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse API response as JSON:', e);
        throw new Error(`Invalid JSON response from API: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
      }
      
      // Validate response format
      if (!data || typeof data !== 'object') {
        console.error('Empty or invalid response from API:', data);
        throw new Error('Received empty or invalid response from API Gateway');
      }
      
      // Check if the response has empty content
      if (!data.content?.text || data.content.text.trim() === '') {
        console.warn('Received empty text content from API Gateway:', data);
        
        // For MVP, provide fallback content when API returns empty
        data.content = data.content || {};
        data.content.text = `We couldn't process that request properly. The API returned an empty response. Please try a different question or check back later.`;
      }
      
      // Check if response contains dynamic view data
      const dynamicView = this.checkResponseForDynamicView(data);
      
      // Transform the API response to the ChatMessage format
      const aiMessage: ChatMessageWithView = {
        id: data.responseId || `msg-${Date.now()}-ai`,
        content: data.content.text,
        sender: 'ai',
        timestamp: new Date(data.timestamp || Date.now()),
        dynamicView: dynamicView || undefined
      };
      
      // Add AI message to current chat
      this.addMessageToCurrentChat(aiMessage);
      return aiMessage;
    } catch (error) {
      console.error('Error calling API Gateway:', error);
      
      // Create a more detailed error message for fallback
      let errorMessage = 'An error occurred while connecting to the server. ';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'The API Gateway appears to be offline. Please check the server status and your connection.';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      }
      
      if (DEVELOPMENT_MODE) {
        // Create a fallback AI message with error details
        const aiMessage: ChatMessageWithView = {
          id: `msg-${Date.now()}-ai`,
          content: `[ERROR FALLBACK] ${errorMessage}\n\nDEVELOPMENT MODE: ${this.generateResponse(message)}`,
          sender: 'ai',
          timestamp: new Date()
        };
        
        // Add AI message to current chat
        this.addMessageToCurrentChat(aiMessage);
        return aiMessage;
      } else {
        // In production, throw the error to be caught by the UI
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
    // In a real app, we would call the API Gateway to get the view
    // But for development, we'll use mock data
    
    try {
      // Wait a bit to simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create a view based on the requested ID
      switch(viewId) {
        case 'table-example':
          return {
            id: 'table-example',
            type: 'table',
            data: {
              title: 'NicorAI Services Comparison',
              headers: ['Service', 'Features', 'Use Case', 'Price'],
              rows: [
                ['API Master', 'API Integration, Custom Endpoints, Documentation', 'Streamline API Management', 'Custom Pricing'],
                ['AI Agent Builder', 'Custom AI Agents, NLP Processing, Integration', 'Automate Customer Support', 'Based on Complexity'],
                ['Data Services', 'Data Processing, Analytics, Dashboards', 'Business Intelligence', 'Subscription Based'],
                ['Web Solutions', 'Custom Web Apps, UI/UX Design, Hosting', 'Online Presence', 'Project Based']
              ]
            }
          };
          
        case 'contact-info':
          return {
            id: 'contact-info',
            type: 'table',
            data: {
              title: 'Contact NicorAI',
              description: 'Reach out to us through any of these channels',
              headers: ['Contact Method', 'Details'],
              rows: [
                ['Email', 'contact@nicor.ai'],
                ['Phone', '+91 (555) 123-4567'],
                ['Office', 'TC 22/228(2), First Floor, SS Plaza, Sastamangalam, Thiruvananthapuram, Kerala, India - 695010'],
                ['Schedule', 'Book a free consultation through our website']
              ],
              footer: 'We typically respond within 24 hours on business days.'
            }
          };
        
        case 'chart-example':
          return {
            id: 'chart-example',
            type: 'chart',
            data: {
              title: 'AI Implementation Success Rate by Industry',
              labels: ['Retail', 'Healthcare', 'Finance', 'Manufacturing', 'Technology'],
              values: [85, 72, 90, 68, 95]
            }
          };
          
        case 'card-example':
          return {
            id: 'card-example',
            type: 'card',
            data: {
              title: 'About NicorAI',
              content: 'NicorAI Systems Private Limited is a company specializing in building custom AI solutions and rapid product development. We help businesses leverage the power of artificial intelligence to automate processes, gain insights from data, and enhance customer experiences.',
              actions: [
                {
                  label: 'Learn More',
                  url: '#'
                },
                {
                  label: 'Contact Us',
                  url: '#'
                }
              ]
            }
          };
          
        default:
          console.warn(`Unknown view ID: ${viewId}`);
          return null;
      }
    } catch (error) {
      console.error('Error fetching dynamic view:', error);
      return null;
    }
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

  // Check if API response has suggested a dynamic view (for Day 6)
  async checkForDynamicView(query: string): Promise<DynamicView | null> {
    try {
      // In a real implementation, this would check if the last API response
      // contained a suggestion for a dynamic view
      
      // For MVP demonstration, we can simulate this by checking if the API response
      // included a responseType field set to "view" with a viewSpec
      
      // To prevent showing the same view for every query, we should only
      // return a view when the query specifically asks for relevant information
      const lowerQuery = query.toLowerCase().trim();

      // Get the current chat messages
      const messages = this.getCurrentChatMessages();
      if (messages.length === 0) return null;
      
      // Get the last AI message
      const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
      if (!lastAiMessage) return null;
      
      // Check if the content has special markers for a view
      // This is just a simple implementation for the MVP - real implementation
      // would use actual API response fields according to the API contract
      const content = lastAiMessage.content;
      
      // If we detect a "view suggestion" pattern in the API response
      // Format: [VIEW_TYPE:data description]
      const viewMatch = content.match(/\[(\w+)_VIEW:([^\]]+)\]/i);
      if (viewMatch) {
        const viewType = viewMatch[1].toLowerCase();
        const viewDescription = viewMatch[2];
        
        // Handle different view types based on markers from the API
        if (viewType === 'table') {
          // For MVP, we'll map to our pre-defined views based on what the API suggested
          if (viewDescription.toLowerCase().includes('contact')) {
            const viewId = 'contact-info';
            // Check if this is the same view we just showed
            if (this.lastDynamicViewId === viewId) {
              // Only repeat if explicitly requested with the same keywords
              if (!lowerQuery.includes('contact')) {
                return null;
              }
            }
            const view = await this.getDynamicView(viewId);
            if (view) {
              this.lastDynamicViewId = viewId;
              return view;
            }
          } else if (viewDescription.toLowerCase().includes('service') || 
                     viewDescription.toLowerCase().includes('product')) {
            const viewId = 'table-example';
            // Check if this is the same view we just showed
            if (this.lastDynamicViewId === viewId) {
              // Only repeat if explicitly requested with the same keywords
              if (!lowerQuery.includes('service') && !lowerQuery.includes('product')) {
                return null;
              }
            }
            const view = await this.getDynamicView(viewId);
            if (view) {
              this.lastDynamicViewId = viewId;
              return view;
            }
          }
        } else if (viewType === 'chart') {
          const viewId = 'chart-example';
          if (this.lastDynamicViewId === viewId && !lowerQuery.includes('chart')) {
            return null;
          }
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        } else if (viewType === 'card') {
          const viewId = 'card-example';
          if (this.lastDynamicViewId === viewId && !lowerQuery.includes('about')) {
            return null;
          }
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
      }
      
      // In development, check keywords in the query itself - only for specific queries
      if (DEVELOPMENT_MODE) {
        // We only want to show a view when specifically asked for it
        // Contact info view
        if (
          lowerQuery === 'contact?' || 
          lowerQuery.includes('contact information') ||
          lowerQuery.includes('how can i contact') ||
          lowerQuery.includes('contact details')
        ) {
          const viewId = 'contact-info';
          if (this.lastDynamicViewId === viewId && !query.trim().toLowerCase().endsWith('contact?')) {
            // Only show again if explicitly requesting with just "contact?"
            return null;
          }
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        } 
        // Service comparison view
        else if (
          lowerQuery.includes('compare services') || 
          lowerQuery.includes('service comparison') ||
          lowerQuery.includes('show comparison') ||
          lowerQuery.includes('compare products') ||
          lowerQuery.includes('product table')
        ) {
          const viewId = 'table-example';
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
        // Performance chart view
        else if (
          lowerQuery.includes('show chart') ||
          lowerQuery.includes('show performance') ||
          lowerQuery.includes('performance chart') ||
          lowerQuery.includes('success rate')
        ) {
          const viewId = 'chart-example';
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
        // About us card view
        else if (
          lowerQuery.includes('about nicor') ||
          lowerQuery.includes('company info') ||
          lowerQuery.includes('about the company')
        ) {
          const viewId = 'card-example';
          const view = await this.getDynamicView(viewId);
          if (view) {
            this.lastDynamicViewId = viewId;
            return view;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for dynamic view:', error);
      return null;
    }
  }

  // Clear the tracked dynamic view (call this when closing a view)
  clearLastDynamicView() {
    this.lastDynamicViewId = null;
  }

  // Helper method to create a dynamic view from API response data
  createDynamicViewFromResponse(responseData: any): DynamicView | null {
    if (!responseData) return null;
    
    try {
      // Check if the response includes viewSpec field
      if (responseData.responseType === 'view' && responseData.content?.viewSpec) {
        const viewSpec = responseData.content.viewSpec;
        const viewType = responseData.content.viewType || 'table';
        
        // Create a dynamic view from the API-provided spec
        return {
          id: `dynamic-${Date.now()}`,
          type: viewType as any, // Cast to our supported types
          data: viewSpec
        };
      }
      
      // Alternative format that might come from the API
      if (responseData.view) {
        return {
          id: `dynamic-${Date.now()}`,
          type: responseData.view.type || 'table',
          data: responseData.view.data || responseData.view
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error creating dynamic view from response:', error);
      return null;
    }
  }
  
  // Update sendMessage to also check for dynamic view data in API response
  // This would be used in a real implementation, but for MVP we're using mock data
  private checkResponseForDynamicView(data: any): DynamicView | null {
    // Check if the response has a view type and view data
    if (data.responseType === 'view' && data.content?.viewSpec) {
      return this.createDynamicViewFromResponse(data);
    }
    
    return null;
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService; 