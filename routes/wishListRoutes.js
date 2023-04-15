const express = require('express');
const router = express.Router();
const wishListController = require('../controllers/wishListController');
const authController = require("../controllers/authController");

router.route('/')
    .get(authController.protect, authController.restrictTo("admin","member") ,wishListController.getWishlist)
    .post(authController.protect, authController.restrictTo("admin","member") ,wishListController.addProductToWishlist);

router.route('/:id')
    .delete(authController.protect, authController.restrictTo("admin","member") ,wishListController.deleteProductFromWishlist);
module.exports = router;