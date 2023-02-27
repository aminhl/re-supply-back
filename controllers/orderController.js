const Order = require('../models/orderModel');
const AppError = require('../utils/appError');


exports.createOrder = async (req, res, next) => {
    try {
        const { supplies } = req.body;

        // Calculate total price and total quantity based on supplies
        const { totalPrice, totalQuantity } = supplies.reduce(
            (acc, curr) => {
                const { quantity, price } = curr;
                const total = price * quantity;
                return {
                    totalPrice: acc.totalPrice + total,
                    totalQuantity: acc.totalQuantity + quantity,
                };
            },
            { totalPrice: 0, totalQuantity: 0 }
        );

        // Create new order
        const order = await Order.create({
            supplies,
            quantity: totalQuantity,
            totalPrice,
        });

        res.status(201).json({
            status: 'success',
            data: {
                order,
            },
        });
    } catch (err) {
        return next(err);
    }
};


exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().populate('supplies.supply');

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: {
                orders,
            },
        });
    } catch (err) {
        return next(err);
    }
};

exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return next(new AppError(`Order not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (err) {
        return next(new AppError(err.message, 500));
    }
}

exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'Order not found',
            });
        }

        res.status(200).json({
            status: 'success',
            data: null,
        });
    } catch (err) {
        return next(err);
    }
};


exports.updateOrder = async (req, res, next) => {
    try {
        const { supplies, quantity } = req.body;
        const { id } = req.params;

        // Check if supplies are valid numbers
        const isValid = supplies.every(
            ({ quantity, price }) => !isNaN(price) && !isNaN(quantity)
        );
        if (!isValid) {
            return next(new AppError(`Invalid Supply data`, 404));
        }

        // Calculate total price and total quantity based on supplies
        const { totalPrice, totalQuantity } = supplies.reduce(
            (acc, curr) => {
                const { quantity, price } = curr;
                const total = price * quantity;
                return {
                    totalPrice: acc.totalPrice + total,
                    totalQuantity: acc.totalQuantity + quantity,
                };
            },
            { totalPrice: 0, totalQuantity: 0 }
        );

        // Update the order
        const order = await Order.findByIdAndUpdate(
            id,
            {
                supplies,
                quantity: totalQuantity,
                totalPrice,
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: {
                order,
            },
        });
    } catch (err) {
        return next(err);
    }
};

