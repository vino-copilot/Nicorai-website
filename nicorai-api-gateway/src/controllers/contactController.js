const emailService = require('../services/emailService');
const recaptchaService = require('../services/recaptchaService');
const { ErrorTypes, asyncHandler } = require('../middleware/errorHandler');

const handleContactForm = asyncHandler(async (req, res) => {
  const { name, email, company, message, recaptchaToken } = req.body;
  
  // Basic validation - now handled by Zod, but keeping as a safety check
  if (!name || !email || !message) {
    throw ErrorTypes.badRequest('Missing required fields (name, email, message)');
  }
  
  // reCAPTCHA verification
  try {
    const recaptchaResult = await recaptchaService.verify(recaptchaToken);
    if (!recaptchaResult.success) {
      throw ErrorTypes.forbidden('reCAPTCHA verification failed. Please try again.');
    }
  } catch (error) {
    if (error.statusCode) {
      throw error; // If it's already an ApiError, just re-throw it
    }
    throw ErrorTypes.internalServer('reCAPTCHA verification failed due to server error.', { cause: error.message });
  }
  
  // Send email
  try {
    await emailService.sendContactEmail(name, email, company, message);
    console.log(`✅ Contact form message sent! Name: ${name}, Email: ${email}`);
    return res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    throw ErrorTypes.internalServer(
      'Failed to send message', 
      { 
        cause: error.message,
        email: { name, email, company }
      }
    );
  }
});

module.exports = {
  handleContactForm
}; 