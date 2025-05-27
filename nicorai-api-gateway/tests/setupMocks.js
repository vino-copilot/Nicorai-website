// Mock RedisService to avoid real Redis connections
jest.mock('../src/services/redisService', () => ({
  isHealthy: false,
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true)
}));

// Mock emailService to avoid sending real emails
jest.mock('../src/services/emailService', () => ({
  sendContactEmail: jest.fn().mockResolvedValue({
    accepted: ['test@example.com'],
    response: '250 OK: Message accepted'
  })
}));

// Mock recaptchaService to always succeed
jest.mock('../src/services/recaptchaService', () => ({
  verify: jest.fn().mockResolvedValue({ success: true, score: 0.9 })
}));

// Mock n8nService to avoid real HTTP calls
jest.mock('../src/services/n8nService', () => ({
  processChatMessage: jest.fn().mockResolvedValue({
    responseId: 'test-response',
    responseType: 'text',
    content: { text: 'Mocked response' },
    timestamp: new Date().toISOString()
  })
})); 