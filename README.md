# RideEasy Carpool Platform

This project consists of a React/Vite frontend and a Node.js/Express/MongoDB backend for a carpooling platform.

## Prerequisites

To run this project, make sure you have the following installed on your machine:
- **Node.js** (v18+)
- **Docker** and **Docker Compose**

## 1. Database Setup (Docker)

The application uses a local MongoDB database that runs seamlessly within Docker. We have provided a `docker-compose.yml` file to start the database instantly.

1. Open a terminal in the root directory.
2. Start the database containers in the background by running:
   ```bash
   docker compose up -d
   ```
3. This creates two services:
   - **MongoDB Engine** (running on port `27017`)
   - **Mongo Express Web Interface** (running on `http://localhost:8081`, login is `admin` / `pass`)

## 2. Backend Setup

Once the database is running, you can boot up the backend API.

1. At the root directory, install backend dependencies:
   ```bash
   npm install
   ```
2. Create or verify a `.env` file in the root directory. It requires these fields:
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   MONGO_URI=mongodb://admin:vyaspapa@127.0.0.1:27017/smartpool?authSource=admin
   ```
3. Start the Express server:
   ```bash
   node server.js
   ```
4. You should see `MongoDB connected to SmartPool DB` in the terminal. The backend runs on port `5000`.

## 3. Frontend Setup

The frontend Vite/React application is housed inside the `frontend` folder.

1. Open a **new, separate terminal** and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the React dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. The server will run on port `3000`. Open your browser and navigate to `http://localhost:3000/`. You're done!
