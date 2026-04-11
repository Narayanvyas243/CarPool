const { google } = require('googleapis');

const sendEmail = async (email, otp, subject = "SmartPool OTP Verification", message = `Your OTP is ${otp}. It will expire in 5 minutes.`) => {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Gmail mandates base64url encoding for the email body
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const emailContent = [
      `To: ${email}`,
      `Subject: ${utf8Subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
      '',
      message,
    ].join('\n');

    const base64EncodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64EncodedEmail,
      },
    });

    console.log(`Email sent successfully via Gmail API: ${subject}`);

  } catch (error) {
    console.error("Gmail API sending failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
