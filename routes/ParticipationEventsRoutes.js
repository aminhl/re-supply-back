const express = require('express');
const router = express.Router();
const ParticipationEventsController = require('../controllers/ParticipationEventsControllers');
const authController = require("../controllers/authController");

router.post('/', authController.protect, authController.restrictTo("admin","member") ,ParticipationEventsController.addEvents);
router.post('/getuserInEvent', authController.protect, authController.restrictTo("admin","member") ,ParticipationEventsController.Checkuserevents);
router.post('/getEmailsForEvent', authController.protect, authController.restrictTo("admin","member") ,ParticipationEventsController.getEmailsForEvent);
module.exports = router;
