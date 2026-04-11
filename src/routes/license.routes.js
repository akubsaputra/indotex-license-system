const express = require("express");
const router = express.Router();

const controller = require("../controllers/license.controller");

/* PRODUCTS */
router.post("/product/create", controller.createProduct);
router.get("/product/all", controller.getProducts);

/* LICENSE */
router.post("/generate", controller.generateLicense);
router.get("/all", controller.getAllLicenses);

module.exports = router;