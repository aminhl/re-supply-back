const express = require('express');
const router = express.Router();
const scheduleMeetingController = require('../controllers/ScheduleMeetingController');
const authController = require("../controllers/authController");

router.get('/',authController.protect, authController.restrictTo("admin","member") , scheduleMeetingController.getAllScheduleMeeting);
router.post('/', authController.protect, authController.restrictTo("admin","member") ,scheduleMeetingController.addScheduleMeeting);
router.post('/findMeetWithIdUser', authController.protect, authController.restrictTo("admin","member") ,scheduleMeetingController.findMeetWithIdUser);
module.exports = router;

