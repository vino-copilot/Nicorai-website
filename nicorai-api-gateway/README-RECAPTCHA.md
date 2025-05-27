# reCAPTCHA Integration Guide

This document explains how reCAPTCHA is integrated into the Nicorai API Gateway to protect both the chat and contact form endpoints from abuse.

## How reCAPTCHA is Implemented

1. **Backend Validation**: All requests to `/chat` and `/contact` endpoints require a valid reCAPTCHA token.
2. **Zod Schema Validation**: The token is validated at the schema level to ensure it's present.
3. **Token Verification**: Each token is verified with Google's reCAPTCHA API to confirm it's valid and meets the minimum score threshold.

## Setup Instructions

### 1. Register for reCAPTCHA

1. Go to the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Sign in with your Google account
3. Register a new site:
   - Enter a label (e.g., "Nicorai Website")
   - Select reCAPTCHA v3
   - Add your domain(s)
   - Accept the Terms of Service
   - Submit

4. You'll receive:
   - Site Key (for frontend)
   - Secret Key (for backend)

### 2. Backend Configuration

1. Add your reCAPTCHA Secret Key to your environment variables:

```
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

2. The score threshold is set to 0.5 by default. You can adjust this in `index.js` if needed.

### 3. Frontend Implementation

Add reCAPTCHA to your frontend forms:

```javascript
// 1. Add the reCAPTCHA script to your HTML
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

// 2. Generate a token when submitting forms
const submitForm = async (formData) => {
  try {
    // Get reCAPTCHA token
    const token = await grecaptcha.execute('YOUR_SITE_KEY', {action: 'submit'});
    
    // Add token to form data
    formData.recaptchaToken = token;
    
    // Send the request
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    // Handle response...
  } catch (error) {
    // Handle error...
  }
};
```

## Testing the Integration

1. Run the test script to verify backend validation:

```bash
node test-recaptcha.js
```

This script tests:
- Requests without reCAPTCHA tokens
- Requests with invalid tokens

2. For complete testing:
   - Implement reCAPTCHA on your frontend
   - Submit real forms with valid tokens
   - Check server logs to verify successful verification

## Troubleshooting

### Common Issues:

1. **Invalid token errors**: 
   - Ensure your secret key is correct
   - Check that the token hasn't expired (tokens are valid for 2 minutes)

2. **Score too low**: 
   - Adjust the threshold in `config.recaptcha.scoreThreshold` if legitimate users are being blocked

3. **Frontend not generating tokens**: 
   - Check browser console for errors
   - Ensure the reCAPTCHA script is loading correctly
   - Verify you're using the correct site key

### Debugging:

- Add additional logging in `recaptchaService.js` to see the full verification response
- Test with known good tokens from the reCAPTCHA demo site

## References

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) 