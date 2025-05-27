// This is the main entry point that redirects to the src/index.js file
// This allows us to maintain backward compatibility with existing scripts and deployments

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Configuration settings
const config = {
  app: {
    port: process.env.PORT || 4000,
  },
  redis: {
    url: process.env.REDIS_URL,
    ttl: 3600, // 1 hour cache TTL
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
  },
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    scoreThreshold: 0.5,
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    addresses: {
      to: process.env.EMAIL_TO_ADDRESS,
      from: process.env.EMAIL_FROM_ADDRESS,
    }
  }
};

// Export config for use in other modules
module.exports.config = config;

// Import routes
const chatRoutes = require('./src/routes/chatRoutes');
const contactRoutes = require('./src/routes/contactRoutes');

// Import middleware
const { errorHandler, notFoundHandler, methodNotAllowedHandler, ErrorTypes } = require('./src/middleware/errorHandler');
const { validate, schemas } = require('./src/middleware/zodValidator');

// Create Express app
const app = express();

// Apply security middleware
app.use(helmet()); // Set secure HTTP headers

// Set up CORS to only allow requests from the frontend origin
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  credentials: false // Allow cookies if needed
}));

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Parse JSON request body
app.use(express.json());

// Apply routes with Zod validation middleware
app.use('/chat', validate(schemas.chat), chatRoutes);
app.use('/contact', validate(schemas.contact), contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Handle incorrect methods for defined endpoints
app.put('/chat', (req, res, next) => {
  next(ErrorTypes.methodNotAllowed('PUT method is not allowed for /chat endpoint. Use POST instead.'));
});

app.delete('/chat', (req, res, next) => {
  next(ErrorTypes.methodNotAllowed('DELETE method is not allowed for /chat endpoint. Use POST instead.'));
});

app.put('/contact', (req, res, next) => {
  next(ErrorTypes.methodNotAllowed('PUT method is not allowed for /contact endpoint. Use POST instead.'));
});

app.delete('/contact', (req, res, next) => {
  next(ErrorTypes.methodNotAllowed('DELETE method is not allowed for /contact endpoint. Use POST instead.'));
});

app.all('/health', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    next(ErrorTypes.methodNotAllowed(`${req.method} method is not allowed for /health endpoint. Use GET instead.`));
  } else {
    next();
  }
});

// Apply 404 handler for undefined routes
app.use(notFoundHandler);

// Apply error handler (must be last)
app.use(errorHandler);

// Start the server
const PORT = config.app.port;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
}); 