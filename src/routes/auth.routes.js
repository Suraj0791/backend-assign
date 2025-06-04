const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/auth.controller");

// Register (for initial admin setup/testing)
router.post("/register", register);

// Login
router.post("/login", login);

module.exports = router;
