const express = require("express");
const controller = require("../controllers/room.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.get("/available", controller.available);
router.get("/", controller.list);
router.post("/", authorize("admin"), controller.create);
router
  .route("/:id")
  .get(controller.get)
  .put(authorize("admin"), controller.update)
  .delete(authorize("admin"), controller.remove);

module.exports = router;
