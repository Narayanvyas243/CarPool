require("dotenv").config();
const nodemailer = require('nodemailer');

const email = "narayan.vyas12@gmail.com";
const otp = "888888";
const subject = "MIME Consistency Test";
const message = `Your OTP: ${otp}`;

const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #3b82f6; text-align: center;">SmartPool Verification</h2>
      <p>Hello,</p>
      <p>Thank you for using SmartPool. Please use the following One-Time Password (OTP) to complete your verification:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e40af; background: #f3f4f6; padding: 10px 20px; border-radius: 5px;">${otp}</span>
      </div>
      <p>This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
    </div>
`;

async function testSMTP() {
    console.log("--- Testing Improved SMTP ---");
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"SmartPool OTP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: message,
      html: htmlContent
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("SMTP SUCCESS:", info.response);
    } catch (error) {
      console.error("SMTP FAILURE:", error.message);
    }
}

async function testGmailMime() {
    console.log("\n--- Testing Gmail API MIME Construction ---");
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageId = `<${Date.now()}@gmail.com>`;
    const date = new Date().toUTCString();

    const emailParts = [
      `From: "SmartPool OTP" <${process.env.EMAIL_USER}>`,
      `To: ${email}`,
      `Subject: ${utf8Subject}`,
      `Message-ID: ${messageId}`,
      `Date: ${date}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="boundary-string"`,
      '',
      `--boundary-string`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      message,
      '',
      `--boundary-string`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      htmlContent,
      '',
      `--boundary-string--`
    ];

    const emailRaw = emailParts.join('\r\n');
    console.log("MIME Body Preview (First 200 chars):\n", emailRaw.substring(0, 200));
    
    if (emailRaw.includes('\r\n') && emailRaw.includes('--boundary-string')) {
        console.log("MIME Format: VALID (CRLF and Boundaries present)");
    } else {
        console.log("MIME Format: INVALID");
    }

    const base64EncodedEmail = Buffer.from(emailRaw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log("Base64URL length:", base64EncodedEmail.length);
}

async function run() {
    await testSMTP();
    await testGmailMime();
}

run();
