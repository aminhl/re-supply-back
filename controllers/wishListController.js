const Wishlist = require('../models/wishListModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');


exports.addProductToWishlist = async (req, res, next) => {
    try {
        const product = await Product.findById(req.body.productId);
        if (!product) return next(new AppError(`Product not found`, 404));
        const user = await User.findById(req.user.id);
        if (!user) return next(new AppError(`User not found`, 404));
        const wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            const newWishlist = await Wishlist.create({
                user: req.user.id,
                products: [req.body.productId],
            });
            res.status(201).json({
                status: 'success',
                data: {
                    wishlist: newWishlist,
                },
            });
        } else {
            const productInWishlist = wishlist.products.find(
                (product) => product == req.body.productId
            );
            if (productInWishlist) {
                return next(new AppError(`Product already in wishlist`, 400));
            }
            wishlist.products.push(req.body.productId);
            await wishlist.save();
            res.status(200).json({
                status: 'success',
                data: {
                    wishlist,
                },
            });
        }
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.getWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id })
            .populate('products')
            .populate('user');
        if (!wishlist) return next(new AppError(`Wishlist not found`, 200));
        res.status(200).json({
            status: 'success',
            data: {
                wishlist,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.deleteProductFromWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
        if (!wishlist) return next(new AppError(`Wishlist not found`, 200));
        const productInWishlist = wishlist.products.find(
            (product) => product._id.toString() === req.params.id
        );
        if (!productInWishlist) {
            return next(new AppError(`Product not in wishlist`, 400));
        }
        wishlist.products = wishlist.products.filter(
            (product) => product._id.toString() !== req.params.id
        );
        await wishlist.save();
        res.status(200).json({
            status: 'success',
            message: 'Product deleted from wishlist successfully.',
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}