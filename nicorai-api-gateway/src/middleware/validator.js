/**
 * Validation middleware factory
 * Creates a middleware function that validates request data against the provided schema
 * 
 * @param {Object} schema - Validation schema (simple for now, will be replaced with Joi/Zod)
 * @param {String} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];
    
    // Simple validation (will be replaced with Joi/Zod)
    for (const [field, rules] of Object.entries(schema)) {
      if (rules.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
        errors.push(`Field '${field}' is required`);
      }
      
      if (rules.type && data[field] !== undefined) {
        if (rules.type === 'string' && typeof data[field] !== 'string') {
          errors.push(`Field '${field}' must be a string`);
        } else if (rules.type === 'number' && typeof data[field] !== 'number') {
          errors.push(`Field '${field}' must be a number`);
        } else if (rules.type === 'boolean' && typeof data[field] !== 'boolean') {
          errors.push(`Field '${field}' must be a boolean`);
        } else if (rules.type === 'email' && !isValidEmail(data[field])) {
          errors.push(`Field '${field}' must be a valid email address`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors
      });
    }
    
    next();
  };
}

/**
 * Simple email validation helper
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation schemas for each endpoint
const validationSchemas = {
  chat: {
    message: { required: true, type: 'string' },
    userId: { required: false, type: 'string' },
    chatId: { required: false, type: 'string' },
    messageId: { required: false, type: 'string' },
    timestamp: { required: false, type: 'string' },
    recaptchaToken: { required: false, type: 'string' }
  },
  contact: {
    name: { required: true, type: 'string' },
    email: { required: true, type: 'email' },
    company: { required: false, type: 'string' },
    message: { required: true, type: 'string' },
    recaptchaToken: { required: true, type: 'string' }
  }
};

module.exports = {
  validate,
  schemas: validationSchemas
}; 