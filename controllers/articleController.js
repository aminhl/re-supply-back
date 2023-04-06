const AppError = require("./../utils/appError");
const multer = require("multer");
const { Article } = require("../models/articleModel");
const Comment = require("../models/commentModel");
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads/articles");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

exports.addArticle = [
  uploadOptions.array("images"),
  async (req, res) => {
    const files = req.files;
    const basePath = `${req.protocol}://${req.get("host")}/uploads/articles/`;

    let imagesPaths = [];
    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    let article = new Article({
      title: req.body.title,
      description: req.body.description,
      images: imagesPaths,
    });
    article = await article.save();

    if (!article) return res.status(500).send("The article cannot be created");

    res.send(article);
  },
];

exports.getAllArticles = async (req, res, next) => {
  const articles = await Article.find();
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
    const article = await Article.findById(req.params.id).populate(
      "commentsVirtual"
    );
    const comments = article.commentsVirtual;

    if (!article) return next(new AppError(`article not found`, 404));
    res.status(200).json({
      status: "success",
      data: {
        article: article,
        comments: comments,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    const comments = await Comment.deleteMany({ belongsTo: req.params.id });

    if (!article) return next(new AppError(`article not found`, 404));
    res.status(204).json({
      status: "success",
      message: "article deleted with its comments",
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.updateArticle = [
  uploadOptions.array("images"),
  async (req, res, next) => {
    const files = req.files;
    const basePath = `${req.protocol}://${req.get("host")}/uploads/articles/`;

    let imagesPaths = [];
    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }
    try {
      const article = await Article.findByIdAndUpdate(
        req.params.id,

        {
          title: req.body.title,
          description: req.body.description,
          images: imagesPaths,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!article) return next(new AppError(`Resource not found`, 404));
      res.status(200).json({
        status: "success",
        data: {
          article: article,
        },
      });
    } catch (err) {
      return next(new AppError(err, 500));
    }
  },
];
