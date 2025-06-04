const express = require("express");
const router = express.Router();
const {
  getChapters,
  getChapterById,
  createChapter,
  uploadChapters,
} = require("../controllers/chapter.controller");
const {
  authenticateAdmin,
  optionalAuth,
  requireAdmin,
} = require("../middleware/auth.middleware");
const { cacheMiddleware } = require("../middleware/cache.middleware");
const {
  upload,
  handleUploadError,
} = require("../middleware/upload.middleware");
const redisRateLimiter = require("../middleware/rateLimiter.middleware");
const Chapter = require("../models/chapter.model");
const { errorResponse, successResponse } = require("../utils/response");

// Configure rate limiters
const generalRateLimiter = redisRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
});

const uploadRateLimiter = redisRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX_REQUESTS) || 5,
});

// GET all chapters with filters, pagination, and caching
router.get("/", generalRateLimiter, cacheMiddleware(3600), optionalAuth, getChapters);

// Test endpoint to verify environment variables
router.get("/test-env", generalRateLimiter, (req, res) => {
  res.json({
    adminKey: process.env.ADMIN_API_KEY ? "Set" : "Not Set",
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
  });
});

// Test endpoint to check Redis caching
router.get("/test-cache", generalRateLimiter, cacheMiddleware(3600), (req, res) => {
  const timestamp = new Date().toISOString();
  res.json({
    message: "This response is cached for 1 hour",
    timestamp: timestamp,
    cacheKey: `cache:/api/v1/chapters/test-cache`,
  });
});

// GET chapter by ID
router.get("/:id", generalRateLimiter, cacheMiddleware(3600), optionalAuth, getChapterById);

// POST upload chapters (admin only, JSON file upload)
router.post(
  "/upload",
  uploadRateLimiter,
  authenticateAdmin,
  upload.single("file"),
  handleUploadError,
  uploadChapters
);

// POST create a new chapter (admin only)
router.post("/", uploadRateLimiter, authenticateAdmin, createChapter);

module.exports = router;
