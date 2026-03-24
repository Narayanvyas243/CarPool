require("dotenv").config();
const http = require("http");

const connectDB = require("./src/config/db");
const app = require("./src/app");
const { initSocket } = require("./src/socket");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed because database connection failed.");
    process.exit(1);
  }
};

startServer();
