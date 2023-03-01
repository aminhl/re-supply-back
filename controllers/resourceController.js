const Resource = require('../models/resourcesModel');
const AppError = require('./../utils/appError');
const User = require('../models/userModel');
const Product = require("../models/productModel");


exports.addResource = async (req, res, next) => {
    try {
        const resource = await Resource.create({
            user: req.body.user,
            title: req.body.title,
            description: req.body.description,
            link: req.body.link,
        });

        const populatedResource = await resource.populate('user')
        res.status(201).json({
            status: 'success',
            data: {
                resource: populatedResource,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.getAllResources = async (req, res, next) => {
    const resources = await Resource.find();
    try {
        res.status(200).json({
            status: 'success',
            data: {
                resources: resources,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.getResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return next(new AppError(`Resource not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                resource: resource,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.deleteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) return next(new AppError(`Resource not found`, 404));
        res.status(204).json({
            status: 'success',
            message: 'Resource deleted',
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.updateResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!resource) return next(new AppError(`Resource not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                resource: resource,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.getPendingResource = async (req, res, next) => {
    const resources = await Resource.find({status: 'pending'}); // only pending postResource
    try {
        res.status(200).json({
            status: 'success',
            data: {
                resources: resources,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.acceptResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, {status: 'accepted'}, {
            new: true,
            runValidators: true,
        });
        if (!resource) return next(new AppError(`Resource not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                resource: resource,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.rejectResource = async (req, res, next) => {
    try {
        const  resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        if (resource.status !== 'pending') {
            return res.status(400).json({ message: 'Resource status is not pending' });
        }
        await Resource.updateOne({ _id: req.params.id }, { status: 'rejected' });
        await Resource.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Resource rejected and deleted' });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.getAcceptedResources = async (req, res, next) => {
    const resources = await Resource.find({status: 'accepted'}); // only accepted postResource
    try {
        res.status(200).json({
            status: 'success',
            data: {
                resources,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
