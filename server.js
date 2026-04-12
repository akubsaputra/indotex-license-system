const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 ANTI CRASH GLOBAL
process.on("uncaughtException", err => {
  console.error("UNCAUGHT ERROR:", err);
});
process.on("unhandledRejection", err => {
  console.error("UNHANDLED REJECTION:", err);
});

// 🔥 MIDDLEWARE
app.use(cors());
app.use(express.json());

// 🔥 DATABASE (Railway auto pakai DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🔥 INIT TABLE (AUTO CREATE)
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        username TEXT,
        password TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        user_id BIGINT,
        expired TIMESTAMP,
        max_device INT DEFAULT 1
      );
    `);

    console.log("✅ Database ready");
  } catch (err) {
    console.error("DB INIT ERROR:", err);
  }
}
initDB();


// =======================
// 🔐 LOGIN
// =======================
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1 AND password=$2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Login gagal" });
    }

    const user = result.rows[0];

    const license = await pool.query(
      "SELECT * FROM licenses WHERE user_id=$1",
      [user.id]
    );

    res.json({
      success: true,
      user,
      license: license.rows[0] || null
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.json({ success: false, message: "Server error" });
  }
});


// =======================
// 👤 CREATE USER
// =======================
app.post("/api/users", async (req, res) => {
  try {
    const { username, password } = req.body;

    const id = Date.now();

    await pool.query(
      "INSERT INTO users (id, username, password) VALUES ($1,$2,$3)",
      [id, username, password]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    res.json({ success: false });
  }
});


// =======================
// 📋 GET USERS
// =======================
app.get("/api/users", async (req, res) => {
  try {
    const users = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json({ users: users.rows });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.json({ users: [] });
  }
});


// =======================
// ❌ DELETE USER
// =======================
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    await pool.query("DELETE FROM licenses WHERE user_id=$1", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.json({ success: false });
  }
});


// =======================
// 🎟️ ASSIGN LICENSE
// =======================
app.post("/api/license", async (req, res) => {
  try {
    const { user_id, expired, max_device } = req.body;

    // hapus lama
    await pool.query("DELETE FROM licenses WHERE user_id=$1", [user_id]);

    // insert baru
    await pool.query(
      "INSERT INTO licenses (user_id, expired, max_device) VALUES ($1,$2,$3)",
      [user_id, expired, max_device]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("LICENSE ERROR:", err);
    res.json({ success: false });
  }
});


// =======================
// 📋 GET LICENSE LIST
// =======================
app.get("/api/license", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        users.id,
        users.username,
        licenses.expired,
        licenses.max_device
      FROM users
      LEFT JOIN licenses ON users.id = licenses.user_id
      ORDER BY users.id DESC
    `);

    res.json({ data: result.rows });

  } catch (err) {
    console.error("GET LICENSE ERROR:", err);
    res.json({ data: [] });
  }
});


// =======================
// 🚀 ROOT
// =======================
app.get("/", (req, res) => {
  res.send("INDOTEX API RUNNING 🚀");
});


// =======================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});