const express = require("express");
const controller = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate, authorize("admin"));

router.get("/", controller.list);

module.exports = router;
