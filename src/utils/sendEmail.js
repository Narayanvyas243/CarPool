const nodemailer = require("nodemailer");

const sendEmail = async (email, otp, subject = "SmartPool OTP Verification", message = `Your OTP is ${otp}. It will expire in 5 minutes.`) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `SmartPool <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: message
    });

    console.log(`Email sent successfully: ${subject}`);

  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
