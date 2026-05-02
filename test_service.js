require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
    try {
        console.log("Testing email with service: 'gmail'...");
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'vyasnarayan007@gmail.com',
            subject: 'Test Service Gmail',
            text: 'Hello'
        });
        console.log("Email sent successfully", info.messageId);
    } catch (err) {
        console.error("Error sending email:", err);
    }
}
test();
