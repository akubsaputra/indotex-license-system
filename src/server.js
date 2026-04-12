import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/../../")); // akses dashboard.html

// ===== DATABASE MEMORY =====
let users = [];
let scripts = [];
let licenses = [];

// ===== USERS =====
app.get("/api/users", (req,res)=>{
  res.json({ users, licenses });
});

app.post("/api/users", (req,res)=>{
  const { username, password } = req.body;

  const user = {
    id: Date.now(),
    username,
    password
  };

  users.push(user);
  res.json({ user });
});

// ===== SCRIPTS =====
app.get("/api/scripts",(req,res)=>{
  res.json({ scripts });
});

app.post("/api/scripts",(req,res)=>{
  const { name } = req.body;

  const script = {
    id: Date.now(),
    name
  };

  scripts.push(script);
  res.json({ script });
});

// ===== ASSIGN =====
app.post("/api/license/assign",(req,res)=>{
  const { user_id, script_id, expired, max_device } = req.body;

  const existing = licenses.find(l=>l.user_id==user_id);

  if(existing){
    existing.script_id = script_id;
    existing.expired = expired;
    existing.max_device = max_device;
  }else{
    licenses.push({
      user_id,
      script_id,
      expired,
      max_device,
      banned:false
    });
  }

  res.json({ success:true });
});

// ===== DELETE =====
app.delete("/api/users/:id",(req,res)=>{
  const id = parseInt(req.params.id);

  users = users.filter(u=>u.id!==id);
  licenses = licenses.filter(l=>l.user_id!==id);

  res.json({ success:true });
});

// ===== ROOT =====
app.get("/",(req,res)=>{
  res.sendFile(__dirname + "/../../dashboard.html");
});

app.listen(3000,()=>console.log("🔥 http://localhost:3000"));