const express = require("express");
const router = express.Router();
const {
  login,
  register,
  setupAdmin,
} = require("../controllers/auth.controller");

// GET auth endpoints information
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Auth API Endpoints",
    endpoints: {
      register: {
        method: "POST",
        path: "/api/v1/auth/register",
        description: "Register a new user",
        body: {
          username: "string",
          password: "string",
        },
      },
      login: {
        method: "POST",
        path: "/api/v1/auth/login",
        description: "Login with existing credentials",
        body: {
          username: "string",
          password: "string",
        },
      },
      setupAdmin: {
        method: "POST",
        path: "/api/v1/auth/setup-admin",
        description: "Create admin user (requires ADMIN_SETUP_KEY)",
        body: {
          username: "string",
          password: "string",
        },
        headers: {
          "x-admin-setup-key": "string",
        },
      },
    },
  });
});

// Register new user (default role: user)
router.post("/register", register);

// Admin setup (protected by ADMIN_SETUP_KEY)
router.post("/setup-admin", setupAdmin);

// Login
router.post("/login", login);

module.exports = router;
