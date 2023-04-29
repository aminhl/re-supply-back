const Comment = require("../models/commentModel");
const AppError = require("../utils/appError");
const { Article } = require("../models/articleModel");
const User = require("../models/userModel");
exports.addComment = async (req, res, next) => {
  try {
    // Get the article _id from the request URL parameter
    // Create a new comment and set its belongTo field to the article _id
    const comment = new Comment({
      content: req.body.content,
      articleId: req.params.articleId,
      commenterId: req.params.commenterId,
    });

    // Save the comment to the database
    const savedComment = await comment.save();

    // Find the article and update its comments field with the new comment
    const article = await Article.findByIdAndUpdate(
      req.params.articleId,
      { $push: { comments: savedComment._id } },
      { new: true }
    );
    const user = await User.findByIdAndUpdate(
      req.params.commenterId,
      {
        $push: {
          commenterId: savedComment._id,
        },
      },
      { new: true }
    );

    res.status(201).json({
      status: "success",
      data: {
        comment: savedComment,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        content: req.body.content,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!comment) return next(new AppError(`Comment not found`, 404));

    res.status(200).json({
      status: "success",
      message: "Comment updated",
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.getAllComments = async (req, res, next) => {
  const comments = await Comment.find();
  try {
    res.status(200).json({
      status: "success",
      data: {
        comments,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.getAllCommentsByArticle = async (req, res, next) => {
  const articleId = req.params.articleId;
  const comments = await Comment.find({ article: articleId });
  try {
    res.status(200).json({
      status: "success",
      data: {
        comments,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.getCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError(`Comment not found`, 404));
    res.status(200).json({
      status: "success",
      data: {
        comment,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return next(new AppError(`Comment not found`, 404));
    }
    if (comment.userId !== req.user._id) {
      res.status(200).json({
        status: "success",
        message: "Comment updated",
      });
    }
    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully.",
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
