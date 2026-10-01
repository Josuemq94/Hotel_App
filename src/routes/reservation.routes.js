const express = require("express");
const controller = require("../controllers/reservation.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate);

router.route("/").get(controller.list).post(controller.create);
router
  .route("/:id")
  .get(controller.get)
  .put(controller.update)
  .delete(controller.remove);
router.patch("/:id/status", authorize("admin"), controller.updateStatus);

module.exports = router;
