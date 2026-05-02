require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail');

// Mock environment variables for local test if not set
process.env.BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'support@smartpool.com';

async function test() {
  console.log("Testing Brevo Integration...");
  try {
    // We use a dummy email to avoid sending actual spam during logic check
    // If you want to test for real, change 'test@example.com' to your email
    await sendEmail('test@example.com', '123456');
    console.log("Test execution completed. Check logs above for success/failure.");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
