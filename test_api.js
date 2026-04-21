require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require('./src/app');
const request = require('http');

const PORT = 5005;
const server = app.listen(PORT, async () => {
  await connectDB();
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`http://localhost:${PORT}/api/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test User",
      email: "test@stu.upes.ac.in",
      password: "password123",
      phone: "1234567890",
      gender: "male"
    })
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
  process.exit();
});
