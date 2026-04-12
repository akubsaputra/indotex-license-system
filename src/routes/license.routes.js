const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET SCRIPTS
router.get("/scripts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scripts ORDER BY id DESC");
    res.json({ scripts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE SCRIPT
router.post("/scripts", async (req, res) => {
  try {
    const { name } = req.body;

    await pool.query(
      "INSERT INTO scripts (name) VALUES ($1)",
      [name]
    );

    res.json({ message: "Script dibuat" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ASSIGN
router.post("/assign", async (req, res) => {
  try {
    const { user_id, script_id, expire, device } = req.body;

    await pool.query(
      "INSERT INTO licenses (user_id, script_id, expire, max_device) VALUES ($1,$2,$3,$4)",
      [user_id, script_id, expire, device]
    );

    res.json({ message: "Assign berhasil" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;