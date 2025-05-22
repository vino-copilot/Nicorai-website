require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('redis');
 
const app = express();
const PORT = process.env.PORT || 4000;
const REDIS_URL = process.env.REDIS_URL;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
 
let redisHealthy = true; // 🔥 flag to track Redis health
 
const redisClient = createClient({
 
    url: REDIS_URL,
 
    socket: {
 
        reconnectStrategy: false // 🔥 do not keep retrying forever
 
    },
 
    disableClientInfo: true // Disable CLIENT SETINFO command
 
});
 
redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
    redisHealthy = false; // mark Redis as unhealthy
});
 
redisClient.on('connect', () => {
    console.log('✅ Redis connected!');
    redisHealthy = true; // mark Redis as healthy
});
 
const faqAnswers = {
  "how can ai help my business?": "AI can help your business by automating repetitive tasks, analyzing large datasets to extract insights, improving customer experiences through personalization, enhancing decision-making with data-driven recommendations, and optimizing operations to reduce costs and increase efficiency.",
  "what services does nicorai offer?": "NicorAI offers a comprehensive range of services including custom AI solutions, web development, mobile app development, API integration, data analytics, machine learning model development, natural language processing, and AI consulting services tailored to your business needs.",
  "what are the technologies used by nicorai?": "NicorAI uses cutting-edge technologies including React, Next.js, TypeScript, and TailwindCSS for frontend development; Node.js, Express, Python, and Django for backend; MongoDB and PostgreSQL for databases; and TensorFlow, PyTorch, and OpenAI for AI and machine learning implementations.",
  "what industries do you specialize in?": "NicorAI specializes in a variety of industries including healthcare, finance, e-commerce, manufacturing, technology, education, and logistics. Our expertise allows us to develop tailored AI solutions that address the specific challenges and requirements of these diverse sectors."
};
 
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected!');
 
    // Store FAQs permanently in Redis
    for (const [question, answer] of Object.entries(faqAnswers)) {
      const faqKey = `faq:${question}`;
      const alreadyExists = await redisClient.get(faqKey);
      if (!alreadyExists) {
        await redisClient.set(faqKey, answer); // No TTL = permanent
        console.log(`✅ Stored FAQ in Redis: ${faqKey}`);
      }
    }
 
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
    redisHealthy = false;
  }
})();
 
app.use(cors());
app.use(express.json());
 
app.post('/chat', async (req, res) => {
  console.log('➡️ Incoming request body:', req.body);
 
  const { userId, chatId, messageId, message, timestamp } = req.body;
 
  if (!message) {
    return res.status(400).json({ error: 'Missing required field: message' });
  }
 
  const normalizedMessage = message.trim().toLowerCase();
  const faqKey = `faq:${normalizedMessage}`;
  const cacheKey = `chat_cache:${normalizedMessage}`;
  let cachedData;
 
  // 🔍 Check if message is a known FAQ
  if (redisHealthy) {
    try {
      const faqAnswer = await redisClient.get(faqKey);
      if (faqAnswer) {
        const faqResponse = {
          responseId: `${Date.now()}`,
          responseType: "text",
          content: {
            text: faqAnswer
          },
          timestamp: new Date().toISOString()
        };
        console.log('✅ Matched FAQ. Returning instantly.');
        return res.json(faqResponse);
      }
    } catch (err) {
      console.error('❌ Redis FAQ lookup error:', err.message);
    }
  }
 
  // 📦 Check cached response
  if (redisHealthy) {
    try {
      cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('✅ Cache hit! Returning cached response.');
        return res.json(JSON.parse(cachedData));
      }
      console.log('⚠️ Cache miss. Proceeding to call n8n.');
    } catch (err) {
      console.error('❌ Redis GET error (fallback to n8n):', err.message);
      redisHealthy = false;
    }
  } else {
    console.log('⚠️ Skipping Redis check: marked as unhealthy');
  }
 
  try {
       
 
    const n8nRequestBody = {
        requestId: `${Date.now()}`,
        userId,
        chatId,  // ✅ use fallback here
        messageId,
        message,
        conversationContext: [],
        timestamp: timestamp || new Date().toISOString()
    };
 
    console.log('➡️ Sending to n8n:', n8nRequestBody);
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, n8nRequestBody);
    console.log('⬅️ Received from n8n:', n8nResponse.data);
 
    const transformedResponse = {
      responseId: n8nResponse.data.responseId || `${Date.now()}`,
      responseType: n8nResponse.data.responseType || 'text',
      content: n8nResponse.data.content,
      timestamp: n8nResponse.data.timestamp || new Date().toISOString()
    };
 
    console.log('⬅️ Sending to frontend:', transformedResponse);
 
    // 🧊 Cache this response with TTL
    if (redisHealthy) {
      try {
        const hasValidContent = transformedResponse.content &&
          (transformedResponse.content.text ||
            transformedResponse.content.viewSpec ||
            transformedResponse.content.viewType ||
            transformedResponse.content.output ||
            transformedResponse.content.data);
 
        if (hasValidContent) {
          await redisClient.set(cacheKey, JSON.stringify(transformedResponse), {
            EX: 3600 // Cache for 1 hour
          });
          console.log('✅ Stored response in Redis with 1-hour TTL.');
        } else {
          console.log('⚠️ Skipped caching empty or fallback response.');
        }
      } catch (err) {
        console.error('❌ Redis SET error (skipped caching):', err.message);
        redisHealthy = false;
      }
    }
 
    return res.json(transformedResponse);
 
  } catch (err) {
    console.error('❌ Error calling n8n or transforming response:');
    if (err.response) {
      console.error('🔴 n8n Response Error:', err.response.status, err.response.data);
    } else if (err.request) {
      console.error('🟠 No response from n8n:', err.request);
    } else {
      console.error('⚠️ General Error:', err.message);
    }
    return res.status(500).json({ error: 'Something went wrong while processing your request.' });
  }
});
 
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
});