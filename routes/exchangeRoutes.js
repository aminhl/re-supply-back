const express = require('express');
const exchangeController = require('../controllers/exchangeController');
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/").post(authController.protect, authController.restrictTo("admin","member") ,exchangeController.createExchangeRequest);
router.route("/:id").get(authController.protect, authController.restrictTo("admin","member") ,exchangeController.getExchangeRequestsByUser);
router.route("/:id").patch(authController.protect, authController.restrictTo("admin","member") ,exchangeController.respondToExchangeRequest);

module.exports = router;