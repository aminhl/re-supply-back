const express = require('express');
const resourceController = require('../controllers/resourceController');
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/").post(authController.protect, authController.restrictTo("admin","member") ,resourceController.addResource).get(authController.protect, authController.restrictTo("admin","member") ,resourceController.getAllResources);
router.route("/:id").delete(authController.protect, authController.restrictTo("admin","member") ,resourceController.deleteResource).patch(authController.protect, authController.restrictTo("admin","member") ,resourceController.updateResource);
router.route("/accept/:id").patch(resourceController.acceptResource);
router.route("/reject/:id").patch(resourceController.rejectResource);
router.route("/accepted").get(resourceController.getAcceptedResources);
router.route("/pending").get(resourceController.getPendingResource);
router.route("/get/:id").get(resourceController.getResource);

module.exports = router;
