const express = require("express");
const router = express.Router();
const apiDocs = require("../docs/api");

// Get API documentation
router.get("/", (req, res) => {
  res.json(apiDocs);
});

module.exports = router;
