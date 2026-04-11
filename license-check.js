const axios = require("axios");
const os = require("os");
const Store = require("electron-store");

const store = new Store();

const API_URL = "https://indotex-license-system-production.up.railway.app/api/license/validate";

// 🔥 PRODUCT ID WAJIB
const PRODUCT_ID = "c36ac420-2ffc-45ec-b371-262ad3060b17";

function getHWID() {
  return os.hostname() + "-" + os.userInfo().username;
}

async function validateLicense(licenseKey) {
  try {
    const res = await axios.post(API_URL, {
      license_key: licenseKey,
      hwid: getHWID(),
      product_id: PRODUCT_ID
    });

    if (res.data.success && res.data.valid) {
      store.set("license_key", licenseKey); // 💾 simpan
    }

    return res.data;
  } catch (err) {
    return { success: false };
  }
}

// 🔥 AUTO CHECK
async function autoLogin() {
  const savedKey = store.get("license_key");

  if (!savedKey) return null;

  return await validateLicense(savedKey);
}

module.exports = { validateLicense, autoLogin };