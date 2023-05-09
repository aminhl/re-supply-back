const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/").post(authController.protect, authController.restrictTo("admin","member") ,feedbackController.addFeedback).get(authController.protect, authController.restrictTo("admin","member") ,feedbackController.getAllFeedbacks);
router.route("/:id").delete(authController.protect, authController.restrictTo("admin","member") ,feedbackController.deleteFeedback).patch(authController.protect, authController.restrictTo("admin","member") ,feedbackController.updateFeedback);
router.route("/get/:id").get(authController.protect, authController.restrictTo("admin","member") ,feedbackController.getFeedback);
router.route("/positive").get(authController.protect, authController.restrictTo("admin","member") ,feedbackController.getPositiveFeedbacks);
router.route("/negative").get(authController.protect, authController.restrictTo("admin","member") ,feedbackController.getNegativeFeedbacks);
module.exports = router;