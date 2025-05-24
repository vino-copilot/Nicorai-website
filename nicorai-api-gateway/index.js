require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('redis');
const nodemailer = require('nodemailer');
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
 
(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis connected!');
    } catch (err) {
        console.error('❌ Failed to connect to Redis:', err.message);
        redisHealthy = false;
    }
})();
 
app.use(cors());
app.use(express.json());
 
app.post('/chat', async (req, res) => {
    console.log('➡️ Incoming request body:', req.body);
 
    const { userId, chatId, messageId, message, timestamp, recaptchaToken } = req.body;
 
    if (!message) {
        return res.status(400).json({ error: 'Missing required field: message' });
    }

    // // reCAPTCHA verification
    // const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
    // if (!RECAPTCHA_SECRET_KEY) {
    //     console.error('❌ RECAPTCHA_SECRET_KEY is not set in environment variables.');
    //     return res.status(500).json({ error: 'Server configuration error: reCAPTCHA secret key not set.' });
    // }
 
    // if (!recaptchaToken) {
    //     console.log('⚠️ Missing reCAPTCHA token in request body.');
    //     return res.status(400).json({ error: 'reCAPTCHA token missing.' });
    // }
 
    // try {
    //     console.log('🔑 Using RECAPTCHA_SECRET_KEY (last 4 chars):...' + RECAPTCHA_SECRET_KEY.slice(-4));
    //     console.log('📝 Verifying recaptchaToken:', recaptchaToken);
 
    //     const verificationResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
    //         params: {
    //             secret: RECAPTCHA_SECRET_KEY,
    //             response: recaptchaToken
    //         }
    //     });
 
    //     const { success, score } = verificationResponse.data;
 
    //     console.log('⬅️ Google reCAPTCHA verification response:', verificationResponse.data);
 
    //     if (!success || score < 0.5) { // You can adjust the score threshold (e.g., 0.5, 0.7)
    //         console.warn(`⚠️ reCAPTCHA verification failed or score too low: Success=${success}, Score=${score}`);
    //         return res.status(403).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    //     }
 
    //     console.log(`✅ reCAPTCHA verification successful with score: ${score}`);
 
    // } catch (error) {
    //     console.error('❌ reCAPTCHA verification failed:', error);
    //     return res.status(500).json({ error: 'reCAPTCHA verification failed due to server error.' });
    // }
 
    // // Proceed with chat message processing only if reCAPTCHA is successful
 
 
    const cacheKey = `chat_cache:${message.trim().toLowerCase()}`;
    let cachedData;
 
    // ✅ Only check Redis if marked healthy
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
            redisHealthy = false; // if error, mark as unhealthy
        }
    } else {
        console.log('⚠️ Skipping Redis check: marked as unhealthy');
    }
 
    try {
        // Prepare request for n8n
        
 
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
 
        // Call n8n webhook
        const n8nResponse = await axios.post(N8N_WEBHOOK_URL, n8nRequestBody);
        console.log('⬅️ Received from n8n:', n8nResponse.data);
 
        // Transform to frontend format
        const transformedResponse = {
            responseId: n8nResponse.data.responseId || `${Date.now()}`,
            responseType: n8nResponse.data.responseType || 'text',
            content: n8nResponse.data.content ,
            timestamp: n8nResponse.data.timestamp || new Date().toISOString()
        };
 
        console.log('⬅️ Sending to frontend:', transformedResponse);
 
        // ✅ Only attempt Redis SET if healthy
        if (redisHealthy) {
            try {
                const hasValidContent = transformedResponse.content &&
                    (transformedResponse.content.text ||
                        transformedResponse.content.viewSpec ||
                        transformedResponse.content.viewType ||
                        transformedResponse.content.output || // ✅ your case
                        transformedResponse.content.data);
 
                if (hasValidContent) {
                    await redisClient.set(cacheKey, JSON.stringify(transformedResponse), {
                        EX: 3600 // 1 hour TTL
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

app.post('/contact', async (req, res) => {
  const { name, email, company, message, recaptchaToken } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields (name, email, message)' });
  }

  // reCAPTCHA verification
  const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
  if (!RECAPTCHA_SECRET_KEY) {
    return res.status(500).json({ error: 'Server configuration error: reCAPTCHA secret key not set.' });
  }
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'reCAPTCHA token missing.' });
  }

  try {
    const verificationResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: recaptchaToken
      }
    });
    const { success, score } = verificationResponse.data;
    if (!success || score < 0.5) {
      return res.status(403).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'reCAPTCHA verification failed due to server error.' });
  }

  // SMTP config
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailToAddress = process.env.EMAIL_TO_ADDRESS;
  const emailFromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !emailToAddress || !emailFromAddress) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const emailSubject = `An enquiry from ${name} through the NicorAI website.`;
  const emailTextBody = `\nYou have received a new message from your website contact form:\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || 'Not provided'}\n\nMessage:\n${message}\n  `;

  const mailOptions = {
    from: `"NicorAI Connection Form" <${emailFromAddress}>`,
    to: emailToAddress,
    subject: emailSubject,
    text: emailTextBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Contact form message sent! Name: ${name}, Email: ${email}, Company: ${company}, Message: ${message}`);
    return res.json({ success: true, message: 'Message sent successfully!' });
  } catch (emailError) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});
 
app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
});