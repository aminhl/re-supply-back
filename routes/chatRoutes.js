const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const passport = require("passport");

const router = express.Router();
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
} = require("../controllers/chatController");

router
  .route("/")
  .post(
    authController.protect,
    authController.restrictTo("admin", "member"),
    accessChat
  );
router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin", "member"),
    fetchChats
  );

router
  .route("/addGroup")
  .post(
    authController.protect,
    authController.restrictTo("admin", "member"),
    createGroupChat
  );
router
  .route("/renameGroup")
  .put(
    authController.protect,
    authController.restrictTo("admin", "member"),
    renameGroup
  );
router
  .route("/removeGroup")
  .put(
    authController.protect,
    authController.restrictTo("admin", "member"),
    removeFromGroup
  );
router
  .route("/addToGroup")
  .put(
    authController.protect,
    authController.restrictTo("admin", "member"),
    addToGroup
  );

module.exports = router;
