const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { Resend } = require('resend');
const https = require('https');

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

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || EMAIL_USER;
  const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'SmartPool Security';

  // --- PATH 0: Brevo API (New Primary Path) ---
  if (BREVO_API_KEY && BREVO_SENDER_EMAIL) {
    try {
      console.log(`[Email] Attempting Brevo for ${email}...`);
      const postData = JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: email }],
        subject: subject,
        htmlContent: htmlContent,
        textContent: message
      });

      const options = {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
          'accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const brevoResponse = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data || '{}') }));
        });
        req.on('error', (err) => reject(err));
        req.write(postData);
        req.end();
      });

      if (brevoResponse.statusCode >= 200 && brevoResponse.statusCode < 300) {
        console.log("[Email] Brevo Success:", brevoResponse.data.messageId || "Sent");
        return; // SUCCESS - Exit
      } else {
        console.warn(`[Email] Brevo API error (${brevoResponse.statusCode}):`, brevoResponse.data.message || "Unknown error");
      }
    } catch (err) {
      console.error("[Email] Brevo request failed:", err.message);
    }
  }

  // --- PATH 1: Resend (Best for Deliverability) ---
  if (RESEND_API_KEY) {
    try {
      console.log(`[Email] Attempting Resend for ${email}...`);
      const resend = new Resend(RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: 'SmartPool <onboarding@resend.dev>',
        to: [email],
        reply_to: EMAIL_USER || 'support@smartpool.com',
        subject: subject,
        text: message,
        html: htmlContent,
      });

      if (error) {
        console.warn(`[Email] Resend error: ${error.message}.`);
        // If it's a specific "not authorized" error for Sandbox, we fall back.
        // Otherwise, we might want to throw to avoid double sending if it was just a timeout.
      } else if (data && data.id) {
        console.log("[Email] Resend Success:", data.id);
        return; // SUCCESS - Exit
      }
    } catch (err) {
      console.error("[Email] Resend request failed:", err.message);
    }
  }

  // --- PATH 2: Gmail OAuth2 (Highly Reliable) ---
  if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
    try {
      console.log(`[Email] Attempting OAuth2 for ${email}...`);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
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
      return; // SUCCESS - Exit
    } catch (error) {
      console.error("[Email] OAuth2 Failed:", error.message);
    }
  }

  // --- PATH 3: Basic SMTP (Last Resort) ---
  if (EMAIL_USER && process.env.EMAIL_PASS) {
    console.log(`[Email] Attempting Basic SMTP for ${email}...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
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
      return; // SUCCESS - Exit
    } catch (error) {
      console.error("[Email] SMTP Failed:", error.message);
      throw error;
    }
  }
  
  console.error("[Email] All email methods failed or were not configured.");
};

module.exports = sendEmail;



