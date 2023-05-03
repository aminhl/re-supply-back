const express = require("express");

const {
  allMessages,
  sendMessage,
} = require("../controllers/messageController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/:chatId")
  .get(
    authController.protect,
    authController.restrictTo("admin", "member"),
    allMessages
  );
router
  .route("/")
  .post(
    authController.protect,
    authController.restrictTo("admin", "member"),
    sendMessage
  );

module.exports = router;
