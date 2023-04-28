const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');


exports.addProductToCart = async (req, res, next) => {
    try {
        const product = await Product.findById(req.body.productId);
        if (!product) return next(new AppError(`Product not found`, 404));
        const user = await User.findById(req.user.id);
        if (!user) return next(new AppError(`User not found`, 404));
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            const newCart = await Cart.create({
                user: req.user.id,
                products: [req.body.productId],
            });
            res.status(201).json({
                status: 'success',
                data: {
                    cart: newCart,
                },
            });
        } else {
            const productInCart = cart.products.find(
                (product) => product === req.body.productId
            );
            if (productInCart) {
                return next(new AppError(`Product already in cart`, 400));
            }
            cart.products.push(req.body.productId);
            await cart.save();
            res.status(200).json({
                status: 'success',
                data: {
                    cart,
                },
            });
        }
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate({
                path: 'products',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName'
                }
            })
            .populate('user', 'firstName lastName');

        if (!cart) return next(new AppError(`Cart not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                cart,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}
exports.deleteProductFromCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id }).populate('products');
        if (!cart) return next(new AppError(`Cart not found`, 404));
        const productInCart = cart.products.find(
            (product) => product._id.toString() === req.params.id
        );
        if (!productInCart) {
            return next(new AppError(`Product not in cart`, 400));
        }
        cart.products = cart.products.filter(
            (product) => product._id.toString() !== req.params.id
        );
        await cart.save();
        res.status(200).json({
            status: 'success',
            message: 'Product deleted from cart successfully.',
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

