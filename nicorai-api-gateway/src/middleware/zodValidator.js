const z = require('zod');

/**
 * Creates a middleware function that validates request data against a Zod schema
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {function} Express middleware function
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      // Parse and validate the data against the schema
      const result = schema.parse(req[source]);
      
      // Replace the request data with the validated result
      // This ensures type coercion and default values are applied
      req[source] = result;
      
      next();
    } catch (error) {
      // If validation fails, format the errors and return a 400 response
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Validation Error',
          details: formattedErrors
        });
      }
      
      // For unexpected errors, pass to the next error handler
      next(error);
    }
  };
}

// Commonly used Zod schemas for reuse
const email = z.string().email('Invalid email address');
// More strict validation for non-empty strings
const nonEmptyString = z.string().min(1, 'Cannot be empty').refine(val => val.trim().length > 0, {
  message: 'Cannot be empty or just whitespace'
});

// Define validation schemas for each endpoint
const schemas = {
  chat: z.object({
    message: nonEmptyString.describe('Chat message'),
    userId: z.string().optional(),
    chatId: z.string().optional(),
    messageId: z.string().optional(),
    timestamp: z.string().optional(),
    recaptchaToken: z.string().optional().describe('ReCAPTCHA token')
  }),
  
  contact: z.object({
    name: nonEmptyString.describe('Your name'),
    email: email.describe('Your email address'),
    company: z.string().optional(),
    message: nonEmptyString.describe('Your message'),
    recaptchaToken: nonEmptyString.describe('ReCAPTCHA token')
  })
};

module.exports = {
  validate,
  schemas
}; 