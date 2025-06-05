const express = require("express");
const router = express.Router();
const {
  login,
  register,
  setupAdmin,
} = require("../controllers/auth.controller");

// Register new user (default role: user)
router.post("/register", register);

// Admin setup (protected by ADMIN_SETUP_KEY)
router.post("/setup-admin", setupAdmin);

// Login
router.post("/login", login);

module.exports = router;
