const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();
const authController = require('../controllers/authController');

router.route("/").post(authController.protect, authController.restrictTo("admin","member") ,productController.addProduct).get(authController.protect, authController.restrictTo("admin") ,productController.getAllProducts);
router.route("/:id").delete(authController.protect, authController.restrictTo("admin","member") ,productController.deleteProduct).patch(authController.protect, authController.restrictTo("admin","member") ,productController.updateProduct);
router.route("/accept/:id").patch(authController.protect, authController.restrictTo("admin") ,productController.acceptProduct);
router.route("/reject/:id").patch(authController.protect, authController.restrictTo("admin") ,productController.rejectProduct);
router.route("/accepted").get(authController.protect, authController.restrictTo("admin","member") ,productController.getAcceptedProducts);
router.route("/pending").get(authController.protect, authController.restrictTo("admin") ,productController.getPendingProducts);
router.route("/get/:id").get(authController.protect, authController.restrictTo("admin","member") ,productController.getProduct);
module.exports = router;