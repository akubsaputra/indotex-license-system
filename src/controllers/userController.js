const db = require("../config/db");

exports.getUsers = async (req, res) => {
  const result = await db.query("SELECT * FROM users ORDER BY id DESC");
  res.json({ users: result.rows });
};

exports.createUser = async (req, res) => {
  const { username, password } = req.body;

  await db.query(
    "INSERT INTO users(username,password,devices,max_devices) VALUES($1,$2,$3,$4)",
    [username, password, JSON.stringify([]), 1]
  );

  res.json({ success: true });
};

exports.deleteUser = async (req, res) => {
  await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.json({ success: true });
};