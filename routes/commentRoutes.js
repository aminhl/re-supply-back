const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

router.get("/", commentController.getAllComments);
router.get("/:articleId", commentController.getAllCommentsByArticle);
router.get("/:id", commentController.getCommentById);
router.post("/:articleId/:commenterId", commentController.addComment);
router.patch(
  "/:id",

  commentController.updateComment
);
router.delete(
  "/:id",

  commentController.deleteComment
);
module.exports = router;
