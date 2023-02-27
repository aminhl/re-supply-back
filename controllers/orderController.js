const Order = require('../models/orderModel');
const AppError = require('../utils/appError');


exports.createOrder = async (req, res, next) => {
    try {
        const { products } = req.body;

        // Calculate total price based on products
        const totalPrice = products.reduce(
            (acc, curr) => acc + curr.price,
            0
        );

        // Create new order
        const order = await Order.create({
            products,
            totalPrice,
            postedBy: req.body.postedBy,
            receivedBy: req.body.receivedBy,
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
        const orders = await Order.find().populate('products.product');

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
        const { products } = req.body;
        const { id } = req.params;

        // Check if products are valid numbers
        const isValid = products.every(
            ({ price }) => !isNaN(price)
        );
        if (!isValid) {
            throw new Error('Invalid product data');
        }

        // Calculate total price based on products
        const totalPrice = products.reduce(
            (acc, curr) => acc + curr.price,
            0
        );

        // Update the order
        const order = await Order.findByIdAndUpdate(
            id,
            {
                products,
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


