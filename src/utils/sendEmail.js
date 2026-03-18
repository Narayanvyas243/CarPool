const nodemailer = require("nodemailer");

const sendEmail = async (email, otp) => {
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
      subject: "SmartPool OTP Verification",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`
    });

    console.log("OTP email sent successfully");

  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
