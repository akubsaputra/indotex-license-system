const db = require("../config/db");

exports.login = async (req, res) => {
  const { username, password, hwid } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false });
    }

    const user = result.rows[0];

    if (user.password !== password) {
      return res.json({ success: false });
    }

    let devices = user.devices || [];

    // 🔒 DEVICE LOCK
    if (!devices.includes(hwid)) {
      if (devices.length >= user.max_devices) {
        return res.json({ success: false, reason: "device limit" });
      }

      devices.push(hwid);

      await db.query(
        "UPDATE users SET devices=$1 WHERE id=$2",
        [JSON.stringify(devices), user.id]
      );
    }

    res.json({ success: true, username: user.username });

  } catch (err) {
    res.json({ success: false });
  }
};