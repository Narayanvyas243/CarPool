const nodemailer = require("nodemailer");

const sendEmail = async (email, otp, subject = "SmartPool OTP Verification", message = `Your OTP is ${otp}. It will expire in 5 minutes.`) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      family: 4, // Force IPv4 (Crucial for cloud stability)
      pool: true, // Use a connection pool
      logger: true, // Enable logging
      debug: true,  // Enable debugging
      connectionTimeout: 15000, // Increase to 15 seconds
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
