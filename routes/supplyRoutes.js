const express = require('express');
const supplyController = require('../controllers/supplyController');
const router = express.Router();

router.route("/").post(supplyController.addSupply).get(supplyController.getAllSupplies);
router.route("/:id").get(supplyController.getSupply).delete(supplyController.deleteSupply).patch(supplyController.updateSupply);
module.exports = router;