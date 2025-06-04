const express = require("express");
const router = express.Router();
const {
  getChapters,
  getChapterById,
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

// GET all chapters with filters, pagination, and caching
router.get("/", cacheMiddleware(3600), optionalAuth, getChapters);

// GET chapter by ID
router.get("/:id", optionalAuth, getChapterById);

// POST upload chapters (admin only, JSON file upload)
router.post(
  "/upload",
  authenticateAdmin,
  upload.single("file"),
  handleUploadError,
  uploadChapters
);

module.exports = router;
