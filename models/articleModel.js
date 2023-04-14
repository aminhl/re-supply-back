const mongoose = require("mongoose");
const Comment = require("./commentModel");
const articleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.ObjectId,
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

articleSchema.virtual("commentsVirtual", {
  ref: "Comment",
  localField: "_id",
  foreignField: "belongTo",
});

const Article = mongoose.model("Article", articleSchema);

module.exports = { Article };
