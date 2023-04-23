const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const router = express.Router();

router.route("/").post(feedbackController.addFeedback).get(feedbackController.getAllFeedbacks);
router.route("/:id").delete(feedbackController.deleteFeedback).patch(feedbackController.updateFeedback);
router.route("/get/:id").get(feedbackController.getFeedback);
module.exports = router;