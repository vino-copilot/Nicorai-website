import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, message } = await request.json();

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields (name, email, message)' }, { status: 400 });
    }

    // Get SMTP credentials and email addresses from environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailToAddress = process.env.EMAIL_TO_ADDRESS;
    const emailFromAddress = process.env.EMAIL_FROM_ADDRESS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !emailToAddress || !emailFromAddress) {
      console.error('Missing SMTP configuration or email addresses in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create a Nodemailer transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // For Ethereal, you might need to allow self-signed certificates in development
      // tls: {
      //   rejectUnauthorized: process.env.NODE_ENV === 'production', 
      // },
    });

    // Email content using your approved template
    const emailSubject = `An enquiry from ${name} through the NicorAI website.`;
    const emailTextBody = `
You have received a new message from your website contact form:

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}

Message:
${message}
    `;

    const mailOptions = {
      from: `"NicorAI Contact Form" <${emailFromAddress}>`, // sender address
      to: emailToAddress, // list of receivers
      subject: emailSubject, // Subject line
      text: emailTextBody, // plain text body
      // html: "<b>Hello world?</b>", // You can add an HTML body if needed
    };

    // Send mail with defined transport object
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      // With Ethereal, you can get a preview URL
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
      return NextResponse.json({ success: true, message: 'Message sent successfully!', previewUrl: nodemailer.getTestMessageUrl(info) || null });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 