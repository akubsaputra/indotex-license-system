const express = require("express");
const router = express.Router();
const user = require("../controllers/userController");

router.get("/", user.getUsers);
router.post("/", user.createUser);
router.delete("/:id", user.deleteUser);

module.exports = router;