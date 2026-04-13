require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =======================
// TEST API
// =======================
app.get('/', (req, res) => {
  res.send('INDOTEX API RUNNING 🔥');
});

// =======================
// GET USERS
// =======================
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username FROM users');
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// CREATE USER
// =======================
app.post('/api/create-user', async (req, res) => {
  const { username, password } = req.body;

  try {
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1,$2)',
      [username, password]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// 🔥 LOGIN (INI YANG KAMU BELUM PUNYA)
// =======================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username=$1 AND password=$2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'User tidak ditemukan' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});