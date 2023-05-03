const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/").post(authController.protect, authController.restrictTo("admin","member") ,orderController.createOrder).get(authController.protect, authController.restrictTo("admin",'member') ,orderController.getAllOrders);
router.route("/:id").get(authController.protect, authController.restrictTo("admin","member") ,orderController.getOrder).patch(authController.protect, authController.restrictTo("admin","member") ,orderController.updateOrder).delete(authController.protect, authController.restrictTo("admin","member") ,orderController.deleteOrder);
router.route("/product/").post(authController.protect, authController.restrictTo("admin","member") ,orderController.createSingleOrder);
router.route('/donate/:requestId').post(authController.protect, authController.restrictTo("admin","member"), orderController.donate);
module.exports = router;