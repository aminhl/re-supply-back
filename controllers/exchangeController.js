const Exchange = require('../models/exchangeModel');
const AppError = require('../utils/appError');
const Product = require('../models/productModel');
const User = require('../models/userModel');


exports.createExchangeRequest = async (req, res, next) => {
    try {
        const exchangeRequest = await Exchange.create({
            fromUser: req.body.fromUser,
            toUser: req.body.toUser,
            fromProduct: req.body.fromProduct,
            toProduct: req.body.toProduct,
            status: 'pending'
        });

        res.status(201).json({
            status: 'success',
            data: {
                exchangeRequest
            }
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.getExchangeRequestsByUser = async (req, res, next) => {
    try {
        const exchangeRequests = await Exchange.find({
            $or: [
                { fromUser: req.user.id },
                { toUser: req.user.id }
            ]
        })
            .populate('fromUser', 'firstName lastName email')
            .populate('toUser', 'firstName lastName email')
            .populate('fromProduct')
            .populate('toProduct')
            .exec();

        res.status(200).json({
            status: 'success',
            data: {
                exchangeRequests
            }
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.respondToExchangeRequest = async (req, res, next) => {
    try {
        const exchangeRequest = await Exchange.findById(req.params.id);

        if (!exchangeRequest) {
            return next(new AppError('Exchange request not found', 404));
        }

        if (exchangeRequest.toUser.toString() !== req.user.id) {
            return next(new AppError('You are not authorized to perform this action', 403));
        }

        if (req.body.action === 'accept') {
            exchangeRequest.status = 'accepted';
            await exchangeRequest.save();

            const fromProduct = await Product.findById(exchangeRequest.fromProduct);
            const toProduct = await Product.findById(exchangeRequest.toProduct);

            fromProduct.user = exchangeRequest.toUser;
            toProduct.user = exchangeRequest.fromUser;

            await fromProduct.save();
            await toProduct.save();

            res.status(200).json({
                status: 'success',
                message: 'Exchange request accepted',
                data: {
                    exchangeRequest
                }
            });
        } else if (req.body.action === 'reject') {
            exchangeRequest.status = 'rejected';
            await exchangeRequest.save();

            res.status(200).json({
                status: 'success',
                message: 'Exchange request rejected',
                data: {
                    exchangeRequest
                }
            });
        } else {
            return next(new AppError('Invalid action', 400));
        }
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

