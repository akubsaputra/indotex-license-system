const pool = require("./db");

async function initDb() {
    try {
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS licenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                license_key VARCHAR(100) UNIQUE NOT NULL,
                customer_name VARCHAR(100),
                customer_email VARCHAR(100),
                status VARCHAR(20) DEFAULT 'active',
                expires_at TIMESTAMP NOT NULL,
                activated_devices INT DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS devices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
                device_id VARCHAR(255) NOT NULL,
                device_name VARCHAR(255),
                ip_address VARCHAR(50),
                last_seen TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(license_id, device_id)
            );

            ALTER TABLE licenses
            ADD COLUMN IF NOT EXISTS max_devices INT DEFAULT 1;

            ALTER TABLE licenses
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

            ALTER TABLE licenses
            ADD COLUMN IF NOT EXISTS activated_devices INT DEFAULT 0;

            ALTER TABLE licenses
            ADD COLUMN IF NOT EXISTS notes TEXT;
        `);

        console.log("✅ Database tables initialized / migrated");

    } catch (err) {
        console.error("❌ Init DB Error:", err.message);
    }
}

module.exports = initDb;