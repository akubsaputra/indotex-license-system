const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

/* =========================
   PRODUCT MANAGEMENT
========================= */

exports.createProduct = async (req, res) => {
    try {
        const { product_name } = req.body;

        const result = await pool.query(
            `
            INSERT INTO products (product_name)
            VALUES ($1)
            RETURNING *
            `,
            [product_name]
        );

        res.json({
            success: true,
            product: result.rows[0]
        });

    } catch (err) {
        console.error("Create Product Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM products
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            products: result.rows
        });

    } catch (err) {
        console.error("Get Products Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/* =========================
   LICENSE MANAGEMENT
========================= */

exports.generateLicense = async (req, res) => {
    try {
        const {
            customer_name,
            customer_email,
            custom_expiry,
            max_devices = 1,
            product_id
        } = req.body;

        const deviceLimit = Math.max(
            1,
            Math.min(1000, parseInt(max_devices))
        );

        const licenseKey =
            "INDOTEX-" + uuidv4().split("-")[0].toUpperCase();

        let expiresAt;

        if (custom_expiry) {
            expiresAt = new Date(custom_expiry);

            if (isNaN(expiresAt.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid custom_expiry date"
                });
            }
        } else {
            expiresAt = new Date("2099-12-31T23:59:59");
        }

        const result = await pool.query(
            `
            INSERT INTO licenses (
                license_key,
                customer_name,
                customer_email,
                expires_at,
                max_devices,
                status,
                product_id
            )
            VALUES ($1,$2,$3,$4,$5,'active',$6)
            RETURNING *
            `,
            [
                licenseKey,
                customer_name || null,
                customer_email || null,
                expiresAt,
                deviceLimit,
                product_id
            ]
        );

        res.json({
            success: true,
            message: "License generated successfully",
            license: result.rows[0]
        });

    } catch (err) {
        console.error("Generate License Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.validateLicense = async (req, res) => {
    try {
        const {
            license_key,
            device_id,
            product_id
        } = req.body;

        if (!license_key || !device_id || !product_id) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: "license_key, device_id, product_id required"
            });
        }

        const licenseResult = await pool.query(
            `
            SELECT l.*, p.product_name
            FROM licenses l
            LEFT JOIN products p ON l.product_id = p.id
            WHERE l.license_key = $1
            `,
            [license_key]
        );

        if (licenseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: "License not found"
            });
        }

        const license = licenseResult.rows[0];

        if (license.product_id !== product_id) {
            return res.status(403).json({
                success: false,
                valid: false,
                message: "License not valid for this bot"
            });
        }

        if (license.status !== "active") {
            return res.status(403).json({
                success: false,
                valid: false,
                message: `License ${license.status}`
            });
        }

        if (new Date(license.expires_at) < new Date()) {
            return res.json({
                success: true,
                valid: false,
                message: "License expired"
            });
        }

        const deviceResult = await pool.query(
            `
            SELECT *
            FROM devices
            WHERE license_id = $1
            AND device_id = $2
            `,
            [license.id, device_id]
        );

        if (deviceResult.rows.length > 0) {
            return res.json({
                success: true,
                valid: true,
                message: "Known device",
                license
            });
        }

        const countDevices = await pool.query(
            `
            SELECT COUNT(*)
            FROM devices
            WHERE license_id = $1
            `,
            [license.id]
        );

        const totalDevices =
            parseInt(countDevices.rows[0].count);

        if (totalDevices >= license.max_devices) {
            return res.status(403).json({
                success: false,
                valid: false,
                message: "Device limit reached"
            });
        }

        await pool.query(
            `
            INSERT INTO devices
            (license_id, device_id)
            VALUES ($1, $2)
            `,
            [license.id, device_id]
        );

        res.json({
            success: true,
            valid: true,
            message: "New device registered",
            license
        });

    } catch (err) {
        console.error("Validate License Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.resetDevice = async (req, res) => {
    try {
        const { license_key } = req.body;

        const licenseResult = await pool.query(
            `
            SELECT *
            FROM licenses
            WHERE license_key = $1
            `,
            [license_key]
        );

        if (licenseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "License not found"
            });
        }

        await pool.query(
            `
            DELETE FROM devices
            WHERE license_id = $1
            `,
            [licenseResult.rows[0].id]
        );

        res.json({
            success: true,
            message: "All devices reset successfully"
        });

    } catch (err) {
        console.error("Reset Device Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.updateLicenseStatus = async (req, res) => {
    try {
        const { license_key, status } = req.body;

        if (!["active", "suspended", "banned"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const result = await pool.query(
            `
            UPDATE licenses
            SET status = $1
            WHERE license_key = $2
            RETURNING *
            `,
            [status, license_key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "License not found"
            });
        }

        res.json({
            success: true,
            message: `License ${status}`,
            license: result.rows[0]
        });

    } catch (err) {
        console.error("Update Status Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getAllLicenses = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.*,
                p.product_name,
                (
                    SELECT COUNT(*)
                    FROM devices d
                    WHERE d.license_id = l.id
                ) AS used_devices
            FROM licenses l
            LEFT JOIN products p ON l.product_id = p.id
            ORDER BY l.created_at DESC
        `);

        res.json({
            success: true,
            licenses: result.rows
        });

    } catch (err) {
        console.error("Get All Licenses Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};