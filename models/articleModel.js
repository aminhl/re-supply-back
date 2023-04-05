const mongoose = require("mongoose");
const Comment = require("./commentModel");
const articleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

articleSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "belongTo",
});

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
