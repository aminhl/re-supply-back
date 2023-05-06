const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const authController = require("../controllers/authController");
const requestController = require("../controllers/requestController");

router.get("/", articleController.getAllArticles);
router.get("/:id", articleController.getArticleById);

router.post("/:ownerId", articleController.addArticle);
router.route("/:articleId").patch(authController.protect, authController.restrictTo("admin","member") ,articleController.updateArticle);
router.delete("/:id", articleController.deleteArticle);
module.exports = router;
router.put("/:id", articleController.approveArticle);
