const multer = require("multer");
const { errorResponse } = require("../utils/response");
const winston = require("winston");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to only allow JSON files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/json") {
    cb(null, true);
  } else {
    cb(new Error("Only JSON files are allowed"), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow one file
  },
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json(errorResponse("File size too large. Maximum size is 5MB", 400));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json(errorResponse("Too many files. Only one file is allowed", 400));
    }
    return res.status(400).json(errorResponse("File upload error", 400));
  }

  if (err.message === "Only JSON files are allowed") {
    return res
      .status(400)
      .json(errorResponse("Only JSON files are allowed", 400));
  }

  winston.error("File upload error:", err);
  return res
    .status(500)
    .json(errorResponse("Internal server error during file upload", 500));
};

module.exports = {
  upload,
  handleUploadError,
};
