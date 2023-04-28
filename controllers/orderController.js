require('dotenv').config();
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');


exports.createOrder = async (req, res, next) => {
    try {
        const { products } = req.body;

        // Create new order
        const order = await Order.create({
            products,
            user: req.user.id,
        });

        // Retrieve product data from the database
        const productData = await Promise.all(
            products.map((product) => Product.findById(product.product))
        );

        // Create a line item for each product
        const lineItems = productData.map((product, index) => ({
            price_data: {
                currency: 'usd',
                unit_amount: product.price * 100,
                product_data: {
                    name: product.name,
                    description: product.description,
                    images: [product.image],
                },
            },
            quantity: products[index].quantity || 1,
        }));

        // Get the seller's stripe account id
        const seller = await User.findById(productData[0].owner);
        const sellerStripeAccountId = seller.stripeAccountId;

        // Create a Checkout Session with the line items and seller's Stripe account id
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            payment_intent_data: {
                application_fee_amount: lineItems.reduce((total, item) => total + item.price_data.unit_amount * item.quantity * 0.1, 0),
                transfer_data: {
                    destination: sellerStripeAccountId,
                },
            },
            mode: 'payment',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        });

        res.status(201).json({
            status: 'success',
            data: {
                order,
                session_id: session.id,
                session_url: session.url
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
        const order = await Order.findById(req.query.order_id);
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

exports.SuccessMessage = async (req, res, next) => {
    res.send("Success");
}


