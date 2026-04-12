const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET semua script
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scripts ORDER BY id DESC');
    res.json({ scripts: result.rows });
  } catch (err) {
    console.error(err);
    res.json({ scripts: [] });
  }
});

// CREATE script
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Nama kosong" });
    }

    await pool.query(
      'INSERT INTO scripts (name) VALUES ($1)',
      [name]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

module.exports = router;