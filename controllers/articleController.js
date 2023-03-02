const Article = require('../models/ArticleModel');
const AppError = require('./../utils/appError');
const User = require('../models/userModel');

exports.addArticle = async (req, res, next) => {
    try {
        const article = await Article.create({
            title: req.body.title,
            description: req.body.description,
            image: req.body.image,
        });

        const populatedArticle = await article.populate('user')
        res.status(201).json({
            status: 'success',
            data: {
                article: populatedArticle,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.getAllArticles = async (req, res, next) => {
    const articles = await Article.find();
    try {
        res.status(200).json({
            status: 'success',
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
        const article = await Article.findById(req.params.id);
        if (!article) return next(new AppError(`article not found`, 404));
        res.status(200).json({
            status: 'success',
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
        if (!article) return next(new AppError(`article not found`, 404));
        res.status(204).json({
            status: 'success',
            message: 'article deleted',
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.updateArticle = async (req, res, next) => {
    try {
        const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!article) return next(new AppError(`Resource not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                article: article,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
