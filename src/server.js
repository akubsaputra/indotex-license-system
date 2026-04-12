import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ===== DATABASE SEMENTARA (memory) =====
let users = [];
let scripts = [];
let licenses = [];

// ===== USERS =====
app.get("/api/users", (req, res) => {
  res.json({ users });
});

app.post("/api/users", (req, res) => {
  const { username, password } = req.body;

  const user = {
    id: Date.now(),
    username,
    password
  };

  users.push(user);

  res.json({ success: true, user });
});

// ===== SCRIPTS =====
app.get("/api/scripts", (req, res) => {
  res.json({ scripts });
});

app.post("/api/scripts", (req, res) => {
  const { name } = req.body;

  const script = {
    id: Date.now(),
    name
  };

  scripts.push(script);

  res.json({ success: true, script });
});

// ===== ASSIGN LICENSE =====
app.post("/api/license/assign", (req, res) => {
  const { user_id, script_id, expired, max_device } = req.body;

  licenses.push({
    user_id,
    script_id,
    expired,
    max_device
  });

  res.json({ success: true });
});

// ===== LOGIN (INI YANG EXE BUTUH) =====
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Login gagal" });
  }

  const userLicense = licenses.find(l => l.user_id == user.id);

  if (!userLicense) {
    return res.json({ success: false, message: "Belum assign script" });
  }

  res.json({
    success: true,
    user,
    license: userLicense
  });
});

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("INDOTEX API RUNNING");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});