require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());

// =======================
// DATABASE
// =======================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TEST KONEKSI DB
pool.connect()
  .then(() => console.log("DB CONNECTED ✅"))
  .catch(err => console.error("DB ERROR ❌", err));

// =======================
// ROOT
// =======================
app.get('/', (req, res) => {
  res.send('INDOTEX API RUNNING 🔥');
});

// =======================
// DEBUG ROUTE
// =======================
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: "API OK 🔥" });
});

// =======================
// GET USERS
// =======================
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username FROM users');
    console.log("GET USERS:", result.rows.length);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// CREATE USER
// =======================
app.post('/api/create-user', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "Isi semua field!" });
  }

  try {
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1,$2)',
      [username, password]
    );

    console.log("USER CREATED:", username);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// 🔥 LOGIN FIX TOTAL
// =======================
app.post('/api/login', async (req, res) => {
  console.log("LOGIN HIT 🔥");

  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "Username/password kosong" });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username=$1 AND password=$2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "User tidak ditemukan" });
    }

    console.log("LOGIN SUCCESS:", username);

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// HANDLE 404 (BIAR JELAS)
// =======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route tidak ditemukan ❌"
  });
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 SERVER RUNNING ON PORT", PORT);
  console.log("🔥 LOGIN API AKTIF");
  console.log("=================================");
});