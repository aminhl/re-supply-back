const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/").post(authController.protect, authController.restrictTo("admin") ,orderController.createOrder).get(authController.protect, authController.restrictTo("admin") ,orderController.getAllOrders);
router.route("/:id").get(authController.protect, authController.restrictTo("admin","member") ,orderController.getOrder).patch(authController.protect, authController.restrictTo("admin","member") ,orderController.updateOrder).delete(authController.protect, authController.restrictTo("admin","member") ,orderController.deleteOrder);
module.exports = router;