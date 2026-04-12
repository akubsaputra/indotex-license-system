const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET USERS
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE USER
router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1,$2)",
      [username, password]
    );

    res.json({ message: "User dibuat" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;