const Comment = require("../models/commentModel");
const AppError = require("../utils/appError");

exports.addComment = async (req, res, next) => {
  let comment = await Comment.create({
    content: req.body.content,
  });
  console.log(content);
  try {
    comment = await comment.save();
    console.log(comment);
    res.status(201).json({
      status: "success",
      data: {
        comment,
      },
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
    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully.",
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!comment) return next(new AppError(`Comment not found`, 404));
    res.status(200).json({
      status: "success",
      message: "Comment updated",
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
