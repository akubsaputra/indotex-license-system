const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// HANDLE ERROR GLOBAL (ANTI HTML ERROR)
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ success: false, message: "Server crash" });
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TEST
app.get('/', (req, res) => {
  res.json({ status: "INDOTEX API RUNNING 🚀" });
});

// ================= USERS =================
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.json({ users: [] });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password } = req.body;

    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1,$2)',
      [username, password]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// ================= SCRIPTS =================
app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scripts ORDER BY id DESC');
    res.json({ scripts: result.rows });
  } catch (err) {
    console.error(err);
    res.json({ scripts: [] });
  }
});

app.post('/api/scripts', async (req, res) => {
  try {
    const { name } = req.body;

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

// ================= ASSIGN =================
app.post('/api/assign', async (req, res) => {
  try {
    const { user_id, script_id, expire, device } = req.body;

    await pool.query(
      `INSERT INTO licenses (user_id, script_id, expire, max_device)
       VALUES ($1,$2,$3,$4)`,
      [user_id, script_id, expire, device]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// ================= LOGIN =================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, device_id } = req.body;

    // VALIDASI INPUT
    if (!username || !password) {
      return res.json({ success: false, message: "Data kosong" });
    }

    // CEK USER
    const user = await pool.query(
      'SELECT * FROM users WHERE username=$1 AND password=$2',
      [username, password]
    );

    if (user.rows.length === 0) {
      return res.json({ success: false, message: "User tidak ditemukan" });
    }

    const userId = user.rows[0].id;

    // CEK LICENSE
    const license = await pool.query(
      'SELECT * FROM licenses WHERE user_id=$1',
      [userId]
    );

    if (license.rows.length === 0) {
      return res.json({ success: false, message: "Belum assign license" });
    }

    const lic = license.rows[0];

    // CEK EXPIRE
    if (!lic.expire) {
      return res.json({ success: false, message: "Expire tidak valid" });
    }

    if (new Date() > new Date(lic.expire)) {
      return res.json({ success: false, message: "License expired" });
    }

    // DEVICE CHECK
    if (!device_id) {
      return res.json({ success: false, message: "Device ID kosong" });
    }

    return res.json({
      success: true,
      message: "Login berhasil"
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    // PENTING: PAKSA JSON
    return res.json({
      success: false,
      message: "Server error"
    });
  }
});

// FALLBACK ROUTE (ANTI HTML)
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running'));