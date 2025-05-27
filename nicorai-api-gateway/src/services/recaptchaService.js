const axios = require('axios');
const config = require('../config');

class RecaptchaService {
  async verify(token) {
    if (!config.recaptcha.secretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY is not set in environment variables');
    }

    if (!token) {
      throw new Error('reCAPTCHA token missing');
    }

    try {
      console.log('📝 Verifying recaptchaToken');
      
      const verificationResponse = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify', 
        null, 
        {
          params: {
            secret: config.recaptcha.secretKey,
            response: token
          }
        }
      );
      
      const { success, score } = verificationResponse.data;
      
      console.log('⬅️ Google reCAPTCHA verification response:', verificationResponse.data);
      
      if (!success || score < config.recaptcha.scoreThreshold) {
        console.warn(`⚠️ reCAPTCHA verification failed or score too low: Success=${success}, Score=${score}`);
        return { success: false, score };
      }
      
      console.log(`✅ reCAPTCHA verification successful with score: ${score}`);
      return { success: true, score };
    } catch (error) {
      console.error('❌ reCAPTCHA verification failed:', error.message);
      throw error;
    }
  }
}

module.exports = new RecaptchaService(); 