import app from './app.js';
import config from 'config';
import connectDB from './db.js';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSocketHandlers } from './socket/socketHandlers.js';
dotenv.config();

// Connect to database
connectDB();
// Create HTTP server FIRST
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.get('frontend.url'),
    credentials: true
  }
});

// Initialize socket handlers
initializeSocketHandlers(io);
// Get port from config
const PORT = config.get('server.port');
const HOST = config.get('server.host');

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
});



// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
