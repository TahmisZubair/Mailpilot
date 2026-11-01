import dotenv from "dotenv";
dotenv.config();

console.log("--- Nodemon attempting to start server.ts ---");
import express, { Express, Request, Response } from "express";
import cors from "cors";
import MailRouter from "./Routes/MailRoutes";
// import AIRouter from "./Routes/AIRoutes";
// import "./Services/aiService";

import { connectDB } from "./Config/dbConfig";
// Import queue services to initialize them
import "./Services/emailQueueService";

console.log("--- [server.ts] About to call dotenv.config() ---");

console.log("--- [server.ts] dotenv.config() called ---");

const app: Express = express();
const PORT = parseInt(process.env.PORT || '8101', 10);

//middleware
app.use(express.json({ limit: "10mb" })); // Increase JSON limit for large email batches
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api", MailRouter);
// app.use("/api/ai", AIRouter);

// Initialize database connection and start server
const startServer = async () => {
  console.log("--- [server.ts] startServer() called ---");
  try {
    // Connect to MongoDB first
    console.log("--- [server.ts] About to call connectDB() ---");
    await connectDB();
    console.log("--- [server.ts] connectDB() call completed ---");

    // Initialize email queue system
    console.log("--- [server.ts] Initializing email queue system ---");
    
    // Start the server only after successful database connection
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      console.log(`Database connected successfully`);
      console.log(`Email queue system initialized`);
      console.log(`Queue stats available at http://localhost:${PORT}/api/queue-stats`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing server gracefully...');
  
  try {
    // Close email queue connections
    const { closeQueue } = await import('./Services/emailQueueService');
    await closeQueue();
    console.log('Email queue closed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();
