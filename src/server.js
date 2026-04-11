require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors({
  origin: "*"
}));
app.use(express.json());

// ================= DATABASE =================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// TEST CONNECTION
db.connect()
  .then(() => console.log("✅ DB CONNECTED"))
  .catch(err => console.log("❌ DB ERROR:", err));

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("INDOTEX LICENSE API RUNNING 🚀");
});

// ================= USERS =================

// GET USERS
app.get("/api/users", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users ORDER BY id DESC");
    res.json({ users: result.rows });
  } catch (e) {
    console.log(e);
    res.json({ users: [] });
  }
});

// CREATE USER
app.post("/api/users", async (req, res) => {
  const { username, password } = req.body;

  try {
    await db.query(
      "INSERT INTO users (username, password) VALUES ($1,$2)",
      [username, password]
    );

    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});

// DELETE USER
app.delete("/api/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// ================= SCRIPTS =================

// GET SCRIPTS
app.get("/api/scripts", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM scripts ORDER BY id DESC");
    res.json({ scripts: result.rows });
  } catch (e) {
    res.json({ scripts: [] });
  }
});

// CREATE SCRIPT
app.post("/api/scripts", async (req, res) => {
  const { name } = req.body;

  try {
    await db.query(
      "INSERT INTO scripts (name) VALUES ($1)",
      [name]
    );

    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// ================= ASSIGN SCRIPT =================

app.post("/api/assign-script", async (req, res) => {
  const { user_id, script_id, expires_at, max_devices } = req.body;

  try {
    // hapus assign lama
    await db.query(
      "DELETE FROM user_scripts WHERE user_id=$1",
      [user_id]
    );

    // insert baru
    await db.query(
      "INSERT INTO user_scripts (user_id, script_id, expires_at, max_devices) VALUES ($1,$2,$3,$4)",
      [user_id, script_id, expires_at, max_devices]
    );

    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});

// ================= LOGIN (UNTUK EXE) =================

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.query(
      "SELECT * FROM users WHERE username=$1 AND password=$2",
      [username, password]
    );

    if (user.rows.length === 0) {
      return res.json({ success: false, message: "User tidak ditemukan" });
    }

    const userId = user.rows[0].id;

    const scripts = await db.query(`
      SELECT s.name, us.expires_at, us.max_devices
      FROM scripts s
      JOIN user_scripts us ON s.id = us.script_id
      WHERE us.user_id = $1
    `, [userId]);

    if (scripts.rows.length === 0) {
      return res.json({
        success: false,
        message: "Tidak ada akses script"
      });
    }

    res.json({
      success: true,
      username,
      scripts: scripts.rows
    });

  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});

// ================= PORT (WAJIB RAILWAY) =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 SERVER RUNNING ON PORT", PORT);
});