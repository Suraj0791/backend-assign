const express = require("express");
const router = express.Router();
const {
  getChapters,
  getChapterById,
  uploadChapters,
} = require("../controllers/chapter.controller");
const { adminAuth } = require("../middleware/auth.middleware");
const { cacheMiddleware } = require("../middleware/cache.middleware");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// GET all chapters with filters, pagination, and caching
router.get("/", cacheMiddleware(3600), getChapters);

// GET chapter by ID
router.get("/:id", getChapterById);

// POST upload chapters (admin only, JSON file upload)
router.post("/", adminAuth, upload.single("file"), uploadChapters);

module.exports = router;
