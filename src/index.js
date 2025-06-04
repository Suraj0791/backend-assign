require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createClient } = require("redis");
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const winston = require("winston");

// Import routes
const chapterRoutes = require("./routes/chapter.routes");
const authRoutes = require("./routes/auth.routes");

// Create Express app
const app = express();

// Configure logger
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

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.connect().catch(console.error);

// Rate limiter configuration
const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: "Too many requests from this IP, please try again after a minute",
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Routes
app.use("/api/v1/chapters", chapterRoutes);
app.use("/api/v1/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/chapter-dashboard"
  )
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app; // For testing purposes
