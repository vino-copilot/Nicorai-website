const redisService = require('../services/redisService');
const n8nService = require('../services/n8nService');
const recaptchaService = require('../services/recaptchaService');
const { ErrorTypes, asyncHandler } = require('../middleware/errorHandler');
 
// Using asyncHandler to automatically catch errors and pass them to the error handler
const handleChatMessage = asyncHandler(async (req, res) => {
  console.log('➡️ Incoming request body:', req.body);
 
  const { userId, chatId, messageId, message, timestamp, recaptchaToken } = req.body;
 
  // Basic validation - now handled by Zod, but keeping as a safety check
  if (!message) {
    throw ErrorTypes.badRequest('Missing required field: message');
  }
 
  // Only verify reCAPTCHA on the first message in a chat thread
  let isFirstMessage = false;
  if (chatId) {
    // Check if this is the first message in the thread
    isFirstMessage = false;
  } else {
    // If no chatId, treat as first message (shouldn't happen in normal flow)
    isFirstMessage = true;
  }
 
  if (isFirstMessage && recaptchaToken) {
    try {
      const recaptchaResult = await recaptchaService.verify(recaptchaToken);
      if (!recaptchaResult.success) {
        throw ErrorTypes.forbidden('reCAPTCHA verification failed. Please try again.');
      }
      // No longer storing verification status in Redis
    } catch (error) {
      if (error.statusCode) {
        throw error; // If it's already an ApiError, just re-throw it
      }
      throw ErrorTypes.internalServer('reCAPTCHA verification failed due to server error.', { cause: error.message });
    }
  } else if (isFirstMessage) {
    // First message but no token
    throw ErrorTypes.badRequest('Missing required field: recaptchaToken');
  }
  // If not first message, skip reCAPTCHA verification
 
  // Check Redis cache
  const cacheKey = `chat_cache:${message.trim().toLowerCase()}`;
  let cachedData;
 
  if (redisService.isHealthy) {
    try {
      cachedData = await redisService.get(cacheKey);
      if (cachedData) {
        console.log('✅ Cache hit! Returning cached response.');
        return res.json(JSON.parse(cachedData));
      }
      console.log('⚠️ Cache miss. Proceeding to call n8n.');
    } catch (error) {
      // Just log the error but continue with n8n (treat as cache miss)
      console.error('❌ Redis GET error (fallback to n8n):', error.message);
    }
  } else {
    console.log('⚠️ Skipping Redis check: marked as unhealthy');
  }
 
  // Process with n8n
  try {
    const transformedResponse = await n8nService.processChatMessage({
      userId,
      chatId,
      messageId,
      message,
      timestamp
    });
   
    // Cache the response if valid
    if (redisService.isHealthy) {
      const hasValidContent = transformedResponse.content &&
        (transformedResponse.content.text ||
         transformedResponse.content.viewSpec ||
         transformedResponse.content.viewType ||
         transformedResponse.content.output ||
         transformedResponse.content.data);
     
      if (hasValidContent) {
        try {
          await redisService.set(cacheKey, JSON.stringify(transformedResponse));
          console.log('✅ Stored response in Redis with 1-hour TTL.');
        } catch (error) {
          // Just log the error if caching fails
          console.error('❌ Redis SET error (skipped caching):', error.message);
        }
      } else {
        console.log('⚠️ Skipped caching empty or fallback response.');
      }
    }
   
    return res.json(transformedResponse);
  } catch (error) {
    // Pass to error handler with meaningful context
    throw ErrorTypes.internalServer(
      'Error processing chat message with n8n service',
      { originalError: error.message, userId, messageId }
    );
  }
});
 
module.exports = {
  handleChatMessage
};