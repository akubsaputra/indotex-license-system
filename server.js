const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =======================
// ROOT
// =======================
app.get("/", (req, res) => {
  res.send("INDOTEX API RUNNING 🔥");
});

// =======================
// USERS
// =======================
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.json({ users: [] });
  }
});

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
    console.error(err);
    res.json({ success: false });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    await pool.query("DELETE FROM licenses WHERE user_id=$1", [id]);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// =======================
// LICENSE
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
    console.error(err);
    res.json({ data: [] });
  }
});

app.post("/api/license", async (req, res) => {
  try {
    const { user_id, expired, max_device } = req.body;

    await pool.query("DELETE FROM licenses WHERE user_id=$1", [user_id]);

    await pool.query(
      "INSERT INTO licenses (user_id, expired, max_device) VALUES ($1,$2,$3)",
      [user_id, expired, max_device]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// =======================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});