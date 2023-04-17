const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["accepted", "pending", "rejected"],
      default: "pending",
    },
    commenters: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
