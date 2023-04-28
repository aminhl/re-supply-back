const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authController = require("../controllers/authController");

router.route('/')
    .get(authController.protect, authController.restrictTo("admin","member") ,cartController.getCart)
    .post(authController.protect, authController.restrictTo("admin","member") ,cartController.addProductToCart);

router.route('/:id')
    .delete(authController.protect, authController.restrictTo("admin","member") ,cartController.deleteProductFromCart);
module.exports = router;