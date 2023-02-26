const Feedback = require('../models/feedbackModel');
const AppError = require('../utils/appError');

exports.addFeedback = async (req, res, next) => {
    const feedback = await Feedback.create({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
    });
    try {
        res.status(201).json({
        status: 'success',
        data: {
            feedback,
        },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.getAllFeedbacks = async (req, res, next) => {
    const feedbacks = await Feedback.find();
    try {
        res.status(200).json({
        status: 'success',
        data: {
            feedbacks,
        },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.getFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return next(new AppError(`Feedback not found`, 404));
        res.status(200).json({
        status: 'success',
        data: {
            feedback,
        },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}
exports.deleteFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) {
            return next(new AppError(`Feedback not found`, 404));
        }
        res.status(204).json({
            status: 'success',
            message: 'Feedback deleted successfully.',
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.updateFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        });
        if (!feedback) return next(new AppError(`Feedback not found`, 404));
        res.status(200).json({
        status: 'success',
        message: 'Feedback updated',
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.getFeedbackByName = async (req, res, next) => {
    try {
        const feedback = await Feedback.find({ name: req.params.name });
        if (feedback.length===0) return next(new AppError(`Feedback not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                feedback,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }

}