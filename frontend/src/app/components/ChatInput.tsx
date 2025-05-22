import React, { useState, useRef } from 'react';
import apiService, { DynamicView } from '../services/api';
import { useChatLoading } from '../services/ChatContext';


interface ChatInputProps {
  onMessageSent?: (isClosing?: boolean, dynamicView?: DynamicView) => void;
  isChatExplicitlyClosed?: boolean;
}


type NotificationStatus = 'none' | 'sending' | 'success' | 'error';


const ChatInput: React.FC<ChatInputProps> = ({ onMessageSent, isChatExplicitlyClosed = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [notification, setNotification] = useState<{status: NotificationStatus, message: string}>({
    status: 'none',
    message: ''
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { loadingChats, setLoadingForChat } = useChatLoading();
  const currentChatId = apiService.getCurrentChatId();
 
  // Clear notification after 3 seconds
  const clearNotificationTimeout = useRef<NodeJS.Timeout | null>(null);

  const anyChatLoading = Object.values(loadingChats).some(Boolean);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    const chatIdAtSend = apiService.getCurrentChatId();
    if (loadingChats[chatIdAtSend || '']) return;
    setInputValue('');
    
    // Set loading state to true for the current chat (if exists)
    if (chatIdAtSend) setLoadingForChat(chatIdAtSend, true);
    
    setNotification({
      status: 'sending',
      message: 'Sending message...'
    });
    
    // Create a new chat if:
    // 1. There is no current chat ID, or
    // 2. The chat was explicitly closed, or
    // 3. There are no messages in the current chat
    const currentMessages = chatIdAtSend ? apiService.getCurrentChatMessages() : [];
    let finalChatId = chatIdAtSend;
    
    if (!chatIdAtSend || chatIdAtSend === '' || isChatExplicitlyClosed || currentMessages.length === 0) {
      const newChatId = apiService.createNewChat();
      apiService.setCurrentChat(newChatId);
      finalChatId = newChatId;
      
      // Set the loading state for the new chat
      setLoadingForChat(newChatId, true);
      
      // Trigger chat change event to notify other components about the new chat
      const chatChangeEvent = new CustomEvent('chatChanged', {
        detail: { chatId: newChatId, messages: [] }
      });
      window.dispatchEvent(chatChangeEvent);
    }

    // Get the final chat ID we'll be using (now guaranteed to have a value)
    finalChatId = finalChatId || 'default-chat';
    
    // Get userId using apiService
    const userId = apiService.getUserId();
    
    // Generate a unique message ID
    const messageId = `msg-${Date.now()}-user`;
    
    // Create a detailed message object for logging
    const messageDetails = {
      userId: userId,
      chatId: finalChatId,
      messageId: messageId,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    // Log the complete message details in browser console
    console.log('📨 Complete Message Details:', messageDetails);
    console.table(messageDetails); // Display in table format for better visibility
    
    try {
      const chatIdForSend = apiService.getCurrentChatId() || undefined;
      const aiResponse = await apiService.sendMessage(content, chatIdForSend);
      
      // Always dispatch chat change event to update UI with the response
      const chatChangeEvent = new CustomEvent('chatChanged', {
        detail: { chatId: apiService.getCurrentChatId(), messages: apiService.getCurrentChatMessages() }
      });
      window.dispatchEvent(chatChangeEvent);
      
      setNotification({ status: 'success', message: 'Message sent!' });
      
      if (aiResponse.dynamicView) {
        onMessageSent?.(false, aiResponse.dynamicView);
      } else {
        const lowerContent = content.toLowerCase().trim();
        const isViewRequest =
          lowerContent.includes('contact') ||
          lowerContent.includes('comparison') ||
          lowerContent.includes('products') ||
          lowerContent.includes('chart') ||
          lowerContent.includes('table') ||
          lowerContent.includes('about nicor') ||
          lowerContent.includes('show');
        if (isViewRequest) {
          const apiSuggestedView = await apiService.checkForDynamicView(content);
          if (apiSuggestedView) {
            onMessageSent?.(false, apiSuggestedView);
          }
        }
      }
    } catch (error) {
      setNotification({ status: 'error', message: 'Failed to send message. Please try again.' });
      console.error('Error sending message:', error);
      
      // Make sure to dispatch chat change event even when there's an error
      // This ensures the UI is updated with the error message
      const chatChangeEvent = new CustomEvent('chatChanged', {
        detail: { 
          chatId: apiService.getCurrentChatId(), 
          messages: apiService.getCurrentChatMessages() 
        }
      });
      window.dispatchEvent(chatChangeEvent);
    } finally {
      // Clear loading state for the chat ID we were working with
      if (finalChatId) setLoadingForChat(finalChatId, false);
      
      // Also clear loading for the original chat ID if it's different
      if (chatIdAtSend && chatIdAtSend !== finalChatId) {
        setLoadingForChat(chatIdAtSend, false);
      }
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (loadingChats[currentChatId || '']) return;
    
    // Always notify parent that chat should be visible before sending message
    onMessageSent?.(false);
    
    // Send the message
    sendMessage(inputValue);
  };


  return (
    <form onSubmit={handleSubmit} className="flex items-end relative">
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask any question about NicorAI...."
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
          className={`absolute right-3 mb-1 bottom-3 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 ${
            anyChatLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
     
      {/* Notification popup */}
      {notification.status !== 'none' && (
        <div className={`absolute bottom-full mb-2 right-0 px-3 py-1.5 rounded-xl text-sm flex items-center gap-2 transition-opacity ${
          notification.status === 'sending' ? 'bg-blue-50 text-blue-600' :
          notification.status === 'success' ? 'bg-green-50 text-green-600' :
          'bg-red-50 text-red-600'
        }`}>
          {notification.status === 'sending' ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : notification.status === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {notification.message}
        </div>
      )}
    </form>
  );
};


export default ChatInput;

