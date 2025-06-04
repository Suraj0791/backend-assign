const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { errorResponse } = require("../utils/response");
const winston = require("winston");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Admin access required",
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Authentication failed",
    });
  }
};

// Simple admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  try {
    // Check for API key in headers
    const apiKey =
      req.headers["x-api-key"] ||
      req.headers["authorization"]?.replace("Bearer ", "");

    // Get admin API key from environment
    const adminApiKey = process.env.ADMIN_API_KEY || "admin_default_key";

    if (!apiKey) {
      return res
        .status(401)
        .json(
          errorResponse(
            "Missing API key. Provide x-api-key header or Authorization bearer token.",
            401
          )
        );
    }

    if (apiKey !== adminApiKey) {
      return res
        .status(403)
        .json(errorResponse("Invalid API key. Admin access required.", 403));
    }

    // Add admin info to request
    req.admin = {
      authenticated: true,
      apiKey: apiKey,
    };

    next();
  } catch (error) {
    winston.error("Authentication error:", error);
    res.status(500).json(errorResponse("Authentication error occurred", 500));
  }
};

// Optional authentication middleware (for endpoints that work with or without auth)
const optionalAuth = (req, res, next) => {
  try {
    const apiKey =
      req.headers["x-api-key"] ||
      req.headers["authorization"]?.replace("Bearer ", "");
    const adminApiKey = process.env.ADMIN_API_KEY || "admin_default_key";

    if (apiKey && apiKey === adminApiKey) {
      req.admin = {
        authenticated: true,
        apiKey: apiKey,
      };
    } else {
      req.admin = {
        authenticated: false,
      };
    }

    next();
  } catch (error) {
    winston.error("Optional authentication error:", error);
    // Don't fail on optional auth errors, just continue without admin privileges
    req.admin = { authenticated: false };
    next();
  }
};

// Middleware to check if user has admin privileges
const requireAdmin = (req, res, next) => {
  if (!req.admin || !req.admin.authenticated) {
    return res
      .status(403)
      .json(errorResponse("Admin privileges required for this operation", 403));
  }
  next();
};

module.exports = {
  auth,
  adminAuth,
  authenticateAdmin,
  optionalAuth,
  requireAdmin,
};
