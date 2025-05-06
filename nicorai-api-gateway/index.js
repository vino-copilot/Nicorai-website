require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');   // ✅ Add axios for HTTP calls
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 4000;
const REDIS_URL = process.env.REDIS_URL;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;  // <-- Add this in .env!
console.log('✅ N8N Webhook URL:', N8N_WEBHOOK_URL);

const redisClient = createClient({
    url: REDIS_URL
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis connected!');
    } catch (err) {
        console.error('❌ Failed to connect to Redis:', err.message);
    }
})();

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
    console.log('➡️ Incoming request body:', req.body);

    const { userId, sessionId, message, timestamp } = req.body;

    // Basic validation
    if (!message) {
        return res.status(400).json({
            error: 'Missing required field: message'
        });
    }

    try {
        const cacheKey = `chat_cache:${message.trim().toLowerCase()}`;
        console.log(`🔍 Checking Redis cache for key: ${cacheKey}`);

        // 1️⃣ Try to get from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('✅ Cache hit! Returning cached response.');
            return res.json(JSON.parse(cachedData));
        }
        console.log('⚠️ Cache miss. Proceeding to return MOCK VIEW response.');

        // 🚨 Here we skip calling n8n and send a MOCK view response:
        const mockViewResponse = {
            responseId: `${Date.now()}`,
            responseType: 'view',
            content: {
                viewSpec: {
                    type: 'table',
                    columns: ['Name', 'Age'],
                    rows: [
                        ['Alice', 30],
                        ['Bob', 25]
                    ]
                }
            },
            timestamp: new Date().toISOString()
        };

        console.log('⬅️ Sending MOCK response to frontend:', mockViewResponse);

        // 2️⃣ Store in Redis (1 hour TTL)
        await redisClient.set(cacheKey, JSON.stringify(mockViewResponse), {
            EX: 3600 // 1 hour
        });
        console.log('✅ Stored MOCK response in Redis with 1-hour TTL.');

        return res.json(mockViewResponse);

    } catch (err) {
        console.error('❌ Error processing request:');

        if (err.response) {
            console.error('🔴 Error Response:', err.response.status, err.response.data);
        } else if (err.request) {
            console.error('🟠 No response:', err.request);
        } else {
            console.error('⚠️ General Error:', err.message);
        }

        return res.status(500).json({
            error: 'Something went wrong while processing your request.'
        });
    }
});


app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
});
