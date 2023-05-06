const AppError = require("./../utils/appError");
const multer = require("multer");
const { Article } = require("../models/articleModel");
const Comment = require("../models/commentModel");
const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const User = require("../models/userModel");
// Initialize the Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp();
}
const bucket = admin.storage().bucket();
// Create the multer upload object
const upload = multer();

exports.addArticle = [
  upload.array("images", 5), // Use multer middleware to handle the form data
  async (req, res, next) => {
    try {
      const imageUrls = [];
      if (req.files) {
        for (const file of req.files) {
          const extension = path.extname(file.originalname);
          const filename = `${uuidv4()}${extension}`;
          const fileRef = bucket.file(`articles/${filename}`);
          const stream = fileRef.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
          });
          stream.on("error", (err) => {
            console.log("Error uploading image: ", err);
          });
          stream.on("finish", async () => {
            const FireBaseToken = uuidv4();
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/articles%2F${filename}?alt=media&token=${FireBaseToken}`;
            const imageUrlWithToken = await bucket
                .file(`articles/${filename}`)
                .getSignedUrl({
                  action: "read",
                  expires: "03-17-2024",
                  virtualHostedStyle: true,
                  query: {
                    alt: "media",
                    token: FireBaseToken,
                  },
                });
            imageUrls.push(imageUrlWithToken[0]);
            if (imageUrls.length === req.files.length) {
              const article = new Article({
                title: req.body.title,
                description: req.body.description,
                owner: req.params.ownerId,
                images: imageUrls,
              });
              await article.save();
              const popArticle = await Article.findById(article._id).populate(
                  "owner",
                  "firstName lastName email images"
              );
              res.status(201).json({
                status: "success",
                data: {
                  article: popArticle,
                },
              });
            }
          });
          stream.end(file.buffer);
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send("The article cannot be created");
    }
  },
];


exports.updateArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const updatedArticle = await Article.findByIdAndUpdate(
        articleId,
        {
          title: req.body.title,
          description: req.body.description,
        },
        { new: true, runValidators: true }
    );

    if (!updatedArticle) {
      return next(new AppError('Could not find article to update', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        article: updatedArticle,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getAllArticles = async (req, res, next) => {
  let criteria = {};
  let authorId = req.query.owner;
  console.log(authorId);
  if (authorId) {
    criteria.owner = authorId;
  }
  console.log(criteria);
  const articles = await Article.find(criteria)
    .populate({
      path: "owner",
      select: "firstName lastName email images",
    })
    .populate({
      path: "comments",
      populate: {
        path: "commenterId",
        select: "firstName lastName images",
      },
    });

  try {
    res.status(200).json({
      status: "success",
      data: {
        articles: articles,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate({
        path: "owner",
        select: "firstName lastName email images",
      })
      .populate({
        path: "comments",
        populate: {
          path: "commenterId",
          select: "firstName lastName",
        },
      });

    if (!article) return next(new AppError(`article not found`, 404));
    res.status(200).json({
      status: "success",
      data: {
        article: article,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    const comments = await Comment.deleteMany({ comments: req.params.id });

    if (!article) return next(new AppError(`article not found`, 404));
    res.status(204).json({
      status: "success",
      message: "article deleted with its comments",
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.approveArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Request not found" });
    }

    article.isApproved = true;
    await article.save();

    res.json(article);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};
