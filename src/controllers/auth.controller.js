const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

// Register new user (default role: user)
exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required",
      });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res
        .status(400)
        .json({ status: "error", message: "Username already exists" });
    }
    const user = new User({ username, password, role: "user" });
    await user.save();
    res
      .status(201)
      .json({ status: "success", message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

// Admin setup (protected by ADMIN_SETUP_KEY)
exports.setupAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const setupKey = req.headers["x-admin-setup-key"];

    // Verify admin setup key
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({
        status: "error",
        message: "Invalid admin setup key",
      });
    }

    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required",
      });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res
        .status(400)
        .json({ status: "error", message: "Username already exists" });
    }

    const user = new User({ username, password, role: "admin" });
    await user.save();
    res
      .status(201)
      .json({ status: "success", message: "Admin user created successfully" });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required",
      });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ status: "success", token });
  } catch (error) {
    next(error);
  }
};
