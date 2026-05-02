require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail');

async function test() {
    try {
        console.log("Testing email to UPES...");
        // Send to an invalid or test UPES email to see if Google rejects it or hangs
        await sendEmail('test@stu.upes.ac.in', '123456');
        console.log("Email sent successfully");
    } catch (err) {
        console.error("Error sending email:", err);
    }
}
test();
