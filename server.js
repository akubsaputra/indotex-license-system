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
// ROOT
// =======================
app.get('/', (req, res) => {
  res.send('INDOTEX API RUNNING 🔥');
});

// =======================
// LOGIN + LICENSE
// =======================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE username=$1 AND password=$2',
    [username, password]
  );

  if (!result.rows.length) {
    return res.json({ success: false, message: "User tidak ditemukan ❌" });
  }

  const user = result.rows[0];

  // 🔥 STATUS CHECK
  if (user.status === "banned") {
    return res.json({ success: false, message: "Akun dibanned ❌" });
  }

  // 🔥 EXPIRED CHECK
  if (user.expired_at && new Date(user.expired_at) < new Date()) {
    return res.json({ success: false, message: "Lisensi expired ⛔" });
  }

  return res.json({
    success: true,
    user: {
      username: user.username,
      password, // untuk re-check session
    }
  });
});

// =======================
// CREATE USER
// =======================
app.post('/api/create-user', async (req, res) => {
  const { username, password, days = 30 } = req.body;

  const expired = new Date();
  expired.setDate(expired.getDate() + days);

  await pool.query(
    `INSERT INTO users (username, password, status, expired_at)
     VALUES ($1,$2,'active',$3)`,
    [username, password, expired]
  );

  res.json({ success: true });
});

// =======================
// BAN USER
// =======================
app.post('/api/ban-user', async (req, res) => {
  const { username } = req.body;

  await pool.query(
    `UPDATE users SET status='banned' WHERE username=$1`,
    [username]
  );

  res.json({ success: true });
});

// =======================
// EXTEND USER
// =======================
app.post('/api/extend-user', async (req, res) => {
  const { username, days = 30 } = req.body;

  const result = await pool.query(
    "SELECT expired_at FROM users WHERE username=$1",
    [username]
  );

  let current = result.rows[0]?.expired_at || new Date();

  const newDate = new Date(current);
  newDate.setDate(newDate.getDate() + days);

  await pool.query(
    "UPDATE users SET expired_at=$1 WHERE username=$2",
    [newDate, username]
  );

  res.json({ success: true });
});

// =======================
// USERS (STATUS FIX)
// =======================
app.get('/api/users', async (req, res) => {
  const result = await pool.query(
    `SELECT username, status, expired_at FROM users`
  );

  const users = result.rows.map(u => {
    let status = u.status;

    if (u.status === "active" && u.expired_at) {
      if (new Date(u.expired_at) < new Date()) {
        status = "expired";
      }
    }

    return {
      username: u.username,
      status,
      expired_at: u.expired_at
    };
  });

  res.json({ users });
});

// =======================
app.listen(process.env.PORT || 5000, () =>
  console.log("🚀 SERVER RUNNING")
);