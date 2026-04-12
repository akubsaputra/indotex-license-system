const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// serve file luar backend (dashboard, login, bot)
app.use(express.static(path.join(__dirname, "..")));

// ===== STORAGE =====
let users = [];
let licenses = [];

// ===== TEST =====
app.get("/test", (req,res)=>{
  res.send("SERVER HIDUP 🔥");
});

// ===== CREATE USER =====
app.post("/api/users", (req,res)=>{
  const { username, password } = req.body;

  if(!username || !password){
    return res.json({ success:false, message:"Data kosong" });
  }

  const exist = users.find(u=>u.username === username);
  if(exist){
    return res.json({ success:false, message:"User sudah ada" });
  }

  const user = {
    id: Date.now(),
    username,
    password
  };

  users.push(user);

  res.json({ success:true, user });
});

// ===== GET USERS =====
app.get("/api/users",(req,res)=>{
  res.json({ users, licenses });
});

// ===== LOGIN (UNTUK EXE) =====
app.post("/api/login",(req,res)=>{
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if(!user){
    return res.json({ success:false });
  }

  const license = licenses.find(l=>l.user_id == user.id);

  // tidak wajib license biar bot tetap jalan
  res.json({
    success:true,
    user,
    license: license || null
  });
});

// ===== ASSIGN LICENSE =====
app.post("/api/license/assign",(req,res)=>{
  const { user_id, expired, max_device } = req.body;

  const existing = licenses.find(l=>l.user_id==user_id);

  if(existing){
    existing.expired = expired;
    existing.max_device = max_device;
  }else{
    licenses.push({
      user_id,
      expired,
      max_device
    });
  }

  res.json({ success:true });
});

// ===== DELETE USER =====
app.delete("/api/users/:id",(req,res)=>{
  const id = parseInt(req.params.id);

  users = users.filter(u=>u.id!==id);
  licenses = licenses.filter(l=>l.user_id!==id);

  res.json({ success:true });
});

// ===== ROOT =====
app.get("/",(req,res)=>{
  res.sendFile(path.join(__dirname, "..", "dashboard.html"));
});

// ===== START =====
app.listen(3000,()=>{
  console.log("🔥 SERVER RUNNING http://localhost:3000");
});

// ===== GET LICENSE =====
app.get("/api/license", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM licenses");
    res.json({ licenses: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil license" });
  }
});