const Comment = require("../models/commentModel");
const AppError = require("../utils/appError");
const { Article } = require("../models/articleModel");

exports.addComment = async (req, res, next) => {
  try {
    // Get the article _id from the request URL parameter
    // Create a new comment and set its belongTo field to the article _id
    const comment = new Comment({
      content: req.body.content,
      belongTo: req.params.articleId,
      userId: req.params.userId,
    });

    // Save the comment to the database
    const savedComment = await comment.save();

    // Find the article and update its comments field with the new comment
    const article = await Article.findByIdAndUpdate(
      articleId,
      { $push: { comments: savedComment._id } },
      { new: true }
    );

    res.status(201).json({
      status: "success",
      data: {
        comment: savedComment,
        article,
        user: req.user,
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

    if (comment.userId !== req.user._id) {
      res.status(200).json({
        status: "success",
        message: "Comment updated",
      });
    }
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
