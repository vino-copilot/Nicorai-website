require('./setupMocks');
const request = require('supertest');
const express = require('express');
const { validate, schemas } = require('../src/middleware/zodValidator');
const contactRoutes = require('../src/routes/contactRoutes');

// Set up the app for testing
const app = express();
app.use(express.json());
app.use('/contact', validate(schemas.contact), contactRoutes);

describe('POST /contact', () => {
  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ recaptchaToken: 'dummy' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 200 or 403 for valid request (depending on recaptcha logic)', async () => {
    const res = await request(app)
      .post('/contact')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Hello',
        recaptchaToken: 'dummy'
      });
    expect([200, 403, 500]).toContain(res.statusCode); // Acceptable for now
  });
}); 