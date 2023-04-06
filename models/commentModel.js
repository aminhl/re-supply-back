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
    belongTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Article",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
