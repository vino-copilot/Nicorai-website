const express = require('express');
const { handleChatMessage } = require('../controllers/chatController');
const { methodNotAllowedHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Define allowed methods
const ALLOWED_METHODS = ['POST', 'OPTIONS'];

// Apply method not allowed handler to check HTTP methods
router.use('/', methodNotAllowedHandler(ALLOWED_METHODS));

// POST /chat
router.post('/', handleChatMessage);

module.exports = router; 