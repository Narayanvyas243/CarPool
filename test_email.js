require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail');

async function test() {
    try {
        console.log("Testing email...");
        await sendEmail('vyasnarayan007@gmail.com', '123456');
        console.log("Email sent successfully");
    } catch (err) {
        console.error("Error sending email:", err);
    }
}
test();
