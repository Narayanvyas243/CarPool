const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { Resend } = require('resend');

const sendEmail = async (email, otp, subject = "SmartPool Verification Code", message = `Your verification code is ${otp}.`) => {
  const EMAIL_USER = process.env.EMAIL_USER;
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; }
        .header { background-color: #3b82f6; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 2px; }
        .content { padding: 40px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
        .otp-container { text-align: center; margin: 40px 0; background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1; }
        .otp-code { font-size: 36px; font-weight: 800; color: #1e40af; letter-spacing: 8px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }
        .security-note { font-size: 13px; color: #64748b; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">SMARTPOOL</h1>
        </div>
        <div class="content">
          <h2>Verification Required</h2>
          <p>Hello,</p>
          <p>You recently requested a security code for your SmartPool account. Please use the verification code below to proceed:</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p>This code will expire in <strong>5 minutes</strong> for security reasons.</p>
          
          <div class="security-note">
            <p>If you did not request this code, please secure your account immediately or ignore this message. This is an automated security message; please do not reply.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 SmartPool UPES Chapter. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // --- PATH 1: Resend (Best for Deliverability) ---
  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: 'SmartPool <onboarding@resend.dev>',
        to: [email],
        reply_to: EMAIL_USER || 'support@smartpool.com',
        subject: subject,
        text: message, // Removed redundant expiration string
        html: htmlContent,
      });

      if (error) {
        console.warn(`[Email] Resend error (likely Sandbox restriction): ${error.message}. Falling back...`);
        // Fall through to other methods...
      } else {
        console.log("[Email] Resend Success:", data.id);
        return;
      }
    } catch (err) {
      console.error("[Email] Resend request failed:", err.message);
      // Fall through...
    }
  }

  // --- PATH 2: Gmail OAuth2 (Highly Reliable) ---
  if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          type: 'OAuth2',
          user: EMAIL_USER,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN
        }
      });

      const info = await transporter.sendMail({
        from: `"SmartPool Security" <${EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: message,
        html: htmlContent,
        headers: { 'Importance': 'high', 'X-Priority': '1' }
      });

      console.log("[Email] OAuth2 Success:", info.messageId);
      return;
    } catch (error) {
      console.error("[Email] OAuth2 Failed:", error.message);
      // Fall through...
    }
  }

  // --- PATH 3: Basic SMTP (Last Resort) ---
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"SmartPool Security" <${EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: message,
      html: htmlContent,
    });
    console.log("[Email] SMTP Success:", info.messageId);
  } catch (error) {
    console.error("[Email] SMTP Failed:", error.message);
    throw error;
  }
};

module.exports = sendEmail;



