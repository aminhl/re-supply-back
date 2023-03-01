const express = require('express');
const resourceController = require('../controllers/resourceController');
const router = express.Router();

router.route("/").post(resourceController.addResource).get(resourceController.getAllResources);
router.route("/:id").delete(resourceController.deleteResource).patch(resourceController.updateResource);
router.route("/accept/:id").patch(resourceController.acceptResource);
router.route("/reject/:id").patch(resourceController.rejectResource);
router.route("/accepted").get(resourceController.getAcceptedResources);
router.route("/pending").get(resourceController.getPendingResource);
router.route("/get/:id").get(resourceController.getResource);
module.exports = router;