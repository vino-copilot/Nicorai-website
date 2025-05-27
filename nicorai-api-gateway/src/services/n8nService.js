const axios = require('axios');
const config = require('../config');

class N8nService {
  async processChatMessage(chatData) {
    if (!config.n8n.webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL is not set in environment variables');
    }

    const { userId, chatId, messageId, message, timestamp } = chatData;

    // Prepare request for n8n
    const requestBody = {
      requestId: `${Date.now()}`,
      userId: userId || 'anonymous',
      chatId: chatId || `chat_${Date.now()}`,
      messageId: messageId || `msg_${Date.now()}`,
      message,
      conversationContext: [],
      timestamp: timestamp || new Date().toISOString()
    };

    console.log('➡️ Sending to n8n:', requestBody);

    try {
      const response = await axios.post(config.n8n.webhookUrl, requestBody);
      console.log('⬅️ Received from n8n:', response.data);
      
      // Transform to frontend format
      const transformedResponse = {
        responseId: response.data.responseId || `${Date.now()}`,
        responseType: response.data.responseType || 'text',
        content: response.data.content,
        timestamp: response.data.timestamp || new Date().toISOString()
      };

      return transformedResponse;
    } catch (error) {
      console.error('❌ Error calling n8n:', error.message);
      if (error.response) {
        console.error('🔴 n8n Response Error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('🟠 No response from n8n:', error.request);
      }
      throw error;
    }
  }
}

module.exports = new N8nService(); 