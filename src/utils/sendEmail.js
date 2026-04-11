const { Resend } = require('resend');

const sendEmail = async (email, otp, subject = "SmartPool OTP Verification", message = `Your OTP is ${otp}. It will expire in 5 minutes.`) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'SmartPool <onboarding@resend.dev>',
      to: email,
      subject: subject,
      text: message,
    });

    if (error) {
      console.error("Resend Error:", error);
      throw error;
    }

    console.log(`Email sent successfully via Resend: ${subject}`, data);

  } catch (error) {
    console.error("Email sending failed via Resend API:", error);
    throw error;
  }
};

module.exports = sendEmail;
