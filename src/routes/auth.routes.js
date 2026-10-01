const express = require("express");
const controller = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
router.post("/google", controller.google);
router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", authenticate, controller.me);
router.get("/session", authenticate, controller.session);
router.post("/logout", controller.logout);

module.exports = router;
