const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

router.get("/", commentController.getAllComments);
router.get("/:id", commentController.getCommentById);
router.post("/:articleId/:userId", commentController.addComment);
router.patch(
  "/:id/:userId",
  authController.protect,
  authController.restrictTo("admin", "member"),
  commentController.updateComment
);
router.delete(
  "/:id/:userId",
  authController.protect,
  authController.restrictTo("admin", "member"),
  commentController.deleteComment
);
module.exports = router;
