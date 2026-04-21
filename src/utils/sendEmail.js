const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const sendEmail = async (email, otp, subject = "SmartPool Verification Code", message = `Your verification code is ${otp}.`) => {
  const EMAIL_USER = process.env.EMAIL_USER;
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

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

  // Determine transport method
  let transporter;

  if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
    // Standard OAuth2 Transport (Professional Path)
    console.log("[Email] Initializing OAuth2 transporter...");
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN
      }
    });
  } else {
    // Fallback SMTP (Local/Testing Path)
    console.log("[Email] OAuth2 credentials missing. Falling back to SMTP...");
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  const mailOptions = {
    from: `"SmartPool Security" <${EMAIL_USER}>`,
    to: email,
    subject: subject,
    text: `${message} It will expire in 5 minutes.`,
    html: htmlContent,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ${CLIENT_ID ? 'OAuth2' : 'SMTP'} Success: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email] ${CLIENT_ID ? 'OAuth2' : 'SMTP'} Failed:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;


