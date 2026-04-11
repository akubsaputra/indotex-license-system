require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


// ================= ROOT =================
app.get('/', (req, res) => {
    res.send('INDOTEX LICENSE API RUNNING 🚀');
});


// ================= CREATE PRODUCT =================
app.post('/api/products', async (req, res) => {
    try {
        const { name } = req.body;

        const result = await pool.query(
            `INSERT INTO products (id, product_name)
             VALUES ($1, $2)
             RETURNING *`,
            [uuidv4(), name]
        );

        res.json({ success: true, product: result.rows[0] });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: 'Error create product' });
    }
});


// ================= GET PRODUCTS =================
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM products ORDER BY created_at DESC`);
        res.json({ success: true, products: result.rows });
    } catch (err) {
        res.json({ success: false });
    }
});


// ================= GENERATE LICENSE =================
app.post('/api/license/generate', async (req, res) => {
    try {
        const {
            customer_name,
            customer_email,
            product_id,
            expires_at,
            max_devices
        } = req.body;

        const licenseKey = "INDOTEX-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        const result = await pool.query(
            `INSERT INTO licenses 
            (id, license_key, customer_name, customer_email, product_id, expires_at, status, max_devices)
            VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
            RETURNING *`,
            [
                uuidv4(),
                licenseKey,
                customer_name,
                customer_email,
                product_id,
                expires_at || null,
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
        res.json({ success: false, message: "Generate error" });
    }
});


// ================= VALIDATE LICENSE (FIX TOTAL) =================
app.post('/api/license/validate', async (req, res) => {
    try {
        const { license_key, hwid } = req.body;

        if (!license_key) {
            return res.json({ success: false, message: "License required" });
        }

        const result = await pool.query(
            `SELECT * FROM licenses WHERE license_key = $1`,
            [license_key]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: "License not found" });
        }

        const license = result.rows[0];

        // status check
        if (license.status !== 'active') {
            return res.json({ success: false, message: "License inactive" });
        }

        // expired check
        if (license.expires_at && new Date() > new Date(license.expires_at)) {
            return res.json({ success: false, message: "License expired" });
        }

        // ================= DEVICE SYSTEM =================
        const deviceCheck = await pool.query(
            `SELECT * FROM devices WHERE license_id = $1 AND hwid = $2`,
            [license.id, hwid]
        );

        if (deviceCheck.rows.length === 0) {
            // cek jumlah device
            const count = await pool.query(
                `SELECT COUNT(*) FROM devices WHERE license_id = $1`,
                [license.id]
            );

            if (parseInt(count.rows[0].count) >= license.max_devices) {
                return res.json({ success: false, message: "Device limit reached" });
            }

            // insert device baru
            await pool.query(
                `INSERT INTO devices (id, license_id, hwid)
                 VALUES ($1,$2,$3)`,
                [uuidv4(), license.id, hwid]
            );
        }

        return res.json({
            success: true,
            message: "License valid",
            product_id: license.product_id
        });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server error" });
    }
});


// ================= RESET DEVICE =================
app.post('/api/license/reset-device', async (req, res) => {
    try {
        const { license_key } = req.body;

        const license = await pool.query(
            `SELECT * FROM licenses WHERE license_key = $1`,
            [license_key]
        );

        if (license.rows.length === 0) {
            return res.json({ success: false });
        }

        await pool.query(
            `DELETE FROM devices WHERE license_id = $1`,
            [license.rows[0].id]
        );

        res.json({ success: true, message: "Device reset success" });

    } catch (err) {
        res.json({ success: false });
    }
});


// ================= UPDATE STATUS =================
app.post('/api/license/update-status', async (req, res) => {
    try {
        const { license_key, status } = req.body;

        await pool.query(
            `UPDATE licenses SET status = $1 WHERE license_key = $2`,
            [status, license_key]
        );

        res.json({ success: true });

    } catch (err) {
        res.json({ success: false });
    }
});


// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});