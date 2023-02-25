const express = require('express');
const supplyController = require('../controllers/supplyController');
const router = express.Router();

router.route("/").post(supplyController.addSupply).get(supplyController.getAllSupplies);
router.route("/:id").delete(supplyController.deleteSupply).patch(supplyController.updateSupply);
router.route("/accept/:id").patch(supplyController.acceptSupply);
router.route("/reject/:id").patch(supplyController.rejectSupply);
router.route("/accepted").get(supplyController.getAcceptedSupplies);
router.route("/pending").get(supplyController.getPendingSupplies);
router.route("/get/:id").get(supplyController.getSupply);
module.exports = router;