const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

// Register (for initial admin setup/testing)
exports.register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({
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
    const user = new User({ username, password, role: role || "admin" });
    await user.save();
    res
      .status(201)
      .json({ status: "success", message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({
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
