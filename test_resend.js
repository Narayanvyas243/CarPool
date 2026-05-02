require('dotenv').config();
const { Resend } = require('resend');

async function test() {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        console.error("No RESEND_API_KEY found in .env");
        return;
    }

    try {
        console.log("Testing Resend API...");
        const resend = new Resend(RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'vyasnarayan007@gmail.com', // testing with a known gmail
            subject: 'Test Resend',
            html: '<p>It works!</p>'
        });

        if (error) {
            console.error("Resend Error:", error);
        } else {
            console.log("Resend Success:", data);
        }
    } catch (err) {
        console.error("Request Failed:", err.message);
    }
}
test();
