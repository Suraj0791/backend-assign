// src/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

const { connectRedis } = require("./config/redis.config");

// Import routes
const chapterRoutes = require("./routes/chapter.routes");
const authRoutes = require("./routes/auth.routes");
const docsRoutes = require("./routes/docs.routes");

// Create Express app
const app = express();

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter configuration (in-memory store)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Root route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Chapter Performance Dashboard API",
    version: "1.0.0",
    endpoints: {
      chapters: "/api/v1/chapters",
      auth: "/api/v1/auth",
    },
  });
});

// Routes
app.use("/api/v1/chapters", chapterRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/docs", docsRoutes);

// Error-handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// Initialize MongoDB, Redis, and start server
const initializeApp = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/chapter-dashboard"
    );
    logger.info("Connected to MongoDB");

    // 2. Connect to Redis (with better error handling)
    try {
      await connectRedis();
      logger.info("Connected to Redis");
    } catch (error) {
      logger.warn(
        "Failed to connect to Redis, continuing without Redis:",
        error.message
      );
      // Continue without Redis - the app can still function
    }

    // 3. Start Express server
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || "0.0.0.0";
    app.listen(PORT, HOST, () => {
      logger.info(`Server is running on ${HOST}:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to initialize application:", error);
    process.exit(1);
  }
};

initializeApp();

module.exports = app; // for testing purposes (e.g., supertest/jest)
