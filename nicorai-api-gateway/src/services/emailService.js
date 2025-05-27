const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    // Use AWS SES SMTP for transport
    this.transporter = nodemailer.createTransport({
      host: process.env.AWS_SES_SMTP_HOST, // or your SES region
      port: process.env.AWS_SES_SMTP_PORT,
      secure: false, // SSL
      auth: {
        user: process.env.AWS_SES_SMTP_USER,     // SMTP user name (starts with AKIA...)
        pass: process.env.AWS_SES_SMTP_PASSWORD, // SMTP password
      }
    });
  }

  async sendContactEmail(name, email, company, message) {
    if (!config.email.addresses.to || !config.email.addresses.from) {
      throw new Error('Email addresses not configured');
    }

    const subject = `An enquiry from ${name} through the NicorAI website.`;
    const textBody = `You have received a new message from your website contact form:\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || 'Not provided'}\n\nMessage:\n${message}\n`;

    const mailOptions = {
      from: config.email.addresses.from,
      to: config.email.addresses.to,
      subject,
      text: textBody,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Contact form message sent! Name: ${name}, Email: ${email}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  }
}

module.exports = new EmailService(); 