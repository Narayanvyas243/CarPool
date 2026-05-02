require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
    try {
        console.log("Testing email with port 587...");
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'vyasnarayan007@gmail.com',
            subject: 'Test Port 587',
            text: 'Hello'
        });
        console.log("Email sent successfully", info.messageId);
    } catch (err) {
        console.error("Error sending email:", err);
    }
}
test();
