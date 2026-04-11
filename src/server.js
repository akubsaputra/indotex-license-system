require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// ================== CONFIG ==================
app.use(cors());
app.use(express.json());

// ================== DATABASE ==================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ================== ROOT ==================
app.get("/", (req, res) => {
  res.send("INDOTEX LICENSE API RUNNING 🚀");
});

// ================== GENERATE LICENSE ==================
app.post("/api/license/generate", async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      product_id,
      expires_at,
      max_devices
    } = req.body;

    if (!product_id) {
      return res.json({ success: false, message: "product_id required" });
    }

    const license_key =
      "INDOTEX-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const result = await pool.query(
      `
      INSERT INTO licenses (
        id,
        license_key,
        customer_name,
        customer_email,
        product_id,
        expires_at,
        max_devices,
        status,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        $1,$2,$3,$4,$5,$6,'active',NOW()
      )
      RETURNING *
    `,
      [
        license_key,
        customer_name,
        customer_email,
        product_id,
        expires_at || "2099-12-31",
        max_devices || 1
      ]
    );

    res.json({
      success: true,
      message: "License generated successfully",
      license: result.rows[0]
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
});

// ================== VALIDATE LICENSE ==================
app.post("/api/license/validate", async (req, res) => {
  try {
    const { license_key, hwid, product_id } = req.body;

    if (!license_key || !hwid || !product_id) {
      return res.json({
        success: false,
        message: "Missing data"
      });
    }

    const result = await pool.query(
      `SELECT * FROM licenses WHERE license_key = $1`,
      [license_key]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "License not found" });
    }

    const license = result.rows[0];

    // ❌ status check
    if (license.status !== "active") {
      return res.json({ success: false, message: "License not active" });
    }

    // ❌ product check
    if (license.product_id !== product_id) {
      return res.json({ success: false, message: "Wrong product" });
    }

    // ❌ expired check
    if (new Date() > new Date(license.expires_at)) {
      return res.json({ success: false, message: "License expired" });
    }

    // ================= DEVICE CHECK =================
    const devices = await pool.query(
      `SELECT * FROM devices WHERE license_id = $1`,
      [license.id]
    );

    const deviceExists = devices.rows.find((d) => d.hwid === hwid);

    if (!deviceExists) {
      if (devices.rows.length >= license.max_devices) {
        return res.json({
          success: false,
          message: "Device limit reached"
        });
      }

      // add device
      await pool.query(
        `
        INSERT INTO devices (id, license_id, hwid, created_at)
        VALUES (gen_random_uuid(), $1, $2, NOW())
      `,
        [license.id, hwid]
      );
    }

    return res.json({
      success: true,
      message: "License valid",
      license
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
});

// ================== RESET DEVICE ==================
app.post("/api/license/reset", async (req, res) => {
  try {
    const { license_key } = req.body;

    const license = await pool.query(
      `SELECT * FROM licenses WHERE license_key = $1`,
      [license_key]
    );

    if (license.rows.length === 0) {
      return res.json({ success: false, message: "License not found" });
    }

    await pool.query(
      `DELETE FROM devices WHERE license_id = $1`,
      [license.rows[0].id]
    );

    res.json({ success: true, message: "Devices reset success" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});