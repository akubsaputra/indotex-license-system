const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ASSIGN SCRIPT KE USER
router.post("/assign", async (req, res) => {
  try {
    const { user_id, script_id, expired, max_device } = req.body;

    // cek existing
    const existing = await pool.query(
      "SELECT * FROM licenses WHERE user_id=$1",
      [user_id]
    );

    if(existing.rows.length > 0){
      await pool.query(
        "UPDATE licenses SET script_id=$1, expired=$2, max_device=$3 WHERE user_id=$4",
        [script_id, expired, max_device, user_id]
      );
    } else {
      await pool.query(
        "INSERT INTO licenses (user_id, script_id, expired, max_device) VALUES ($1,$2,$3,$4)",
        [user_id, script_id, expired, max_device]
      );
    }

    res.json({ success:true });

  } catch (err) {
    console.error(err);
    res.json({ success:false });
  }
});

module.exports = router;