const Product = require('../models/productModel');
const AppError = require('./../utils/appError');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const serviceAccount = require("../firebase/resupply-379921-2f0e7acb17e7.json");
const { v4: uuidv4 } = require("uuid");

const admin = require("firebase-admin");
const User = require("../models/userModel");

// Initialize the Firebase Admin SDK only once
if (!admin.apps.length) {
    admin.initializeApp();
}
const bucket = admin.storage().bucket();

// Create the multer upload object
const upload = multer();

// Controller to create a new product
exports.addProduct = [
    // Use multer middleware to handle the form data
    upload.array("images", 5),

    async (req, res, next) => {
        try {
            // Upload images to Firebase Cloud Storage
            const imageUrls = [];
            if (req.files) {
                for (const file of req.files) {
                    const extension = path.extname(file.originalname);
                    const filename = `${uuidv4()}${extension}`;
                    const fileRef = bucket.file(`products/${filename}`);
                    const stream = fileRef.createWriteStream({
                        metadata: {
                            contentType: file.mimetype,
                        },
                    });
                    stream.on("error", (err) => {
                        console.log("Error uploading image: ", err);
                    });
                    stream.on("finish", async () => {
                        const FireBaseToken = uuidv4();
                        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/products%2F${filename}?alt=media&token=${FireBaseToken}`;
                        const imageUrlWithToken = await bucket
                            .file(`products/${filename}`)
                            .getSignedUrl({
                                action: "read",
                                expires: "03-17-2024",
                                virtualHostedStyle: true,
                                query: {
                                    alt: "media",
                                    token: FireBaseToken,
                                },
                            });
                        imageUrls.push(imageUrlWithToken[0]);
                        if (imageUrls.length === req.files.length) {
                            // Create a new product with the data from the request body
                            const product = new Product({
                                name: req.body.name,
                                description: req.body.description,
                                price: req.body.price,
                                owner: req.user.id,
                                images: imageUrls,
                            });

                            // Save the product to the database
                            await product.save();

                            // Populate the response with the owner details and images
                            const populatedProduct = await Product.findById(product._id)
                                .populate("owner", "firstName lastName email images")
                                .populate({
                                    path: "owner",
                                    populate: {
                                        path: "images",
                                    },
                                });

                            res.status(201).json({
                                status: "success",
                                data: {
                                    product: populatedProduct,
                                },
                            });
                        }
                    });
                    stream.end(file.buffer);
                }
            } else {
                // Create a new product with the data from the request body
                const product = new Product({
                    name: req.body.name,
                    description: req.body.description,
                    price: req.body.price,
                    owner: req.user.id,
                    images: [],
                });

                // Save the product to the database
                await product.save();

                // Populate the response with the owner details and images
                const populatedProduct = await Product.findById(product._id)
                    .populate("owner", "firstName lastName email images")
                    .populate({
                        path: "owner",
                        populate: {
                            path: "images",
                        },
                    });

                res.status(201).json({
                    status: "success",
                    data: {
                        product: populatedProduct,
                    },
                });
            }
        } catch (err) {
            return next(err);
        }
    },
];



exports.getAllProducts = async (req, res, next) => {
    try {
        const products = await Product.find().populate('owner', 'firstName lastName email images');

        res.status(200).json({
            status: 'success',
            data: {
                products: products,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};


exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'firstName lastName email images');
    if (!product) return next(new AppError(`Product not found`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        product: product,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError(`Product not found`, 404));
    res.status(204).json({
      status: 'success',
      message: 'Product deleted',
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
exports.updateProduct = [
    // Use multer middleware to handle the form data
    upload.array('images', 5),

    async (req, res, next) => {
        try {
            // Find the product to update by ID
            const product = await Product.findById(req.params.id);

            if (!product) {
                return next(new AppError('Product not found', 404));
            }

            // Delete the first image from the server if it exists
            if (product.images.length > 0) {
                const imagePath = path.join(__dirname, '..', 'public', product.images[0]);
                await fs.unlink(imagePath);
            }

            // Update the product with the new data
            product.name = req.body.name;
            product.description = req.body.description;
            product.price = req.body.price;
            product.images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

            // Save the updated product to the database
            await product.save();

            res.status(200).json({
                status: 'success',
                data: {
                    product
                }
            });
        } catch (err) {
            return next(err);
        }
    }
];

exports.getPendingProducts = async (req, res, next) => {
    const products = await Product.find({status: 'pending'}).populate('owner', 'firstName lastName email images'); // only pending supplies
    try {
        res.status(200).json({
            status: 'success',
            data: {
                products: products,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.acceptProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, {status: 'accepted'}, {
        new: true,
        runValidators: true,
        });
        if (!product) return next(new AppError(`Product not found`, 404));
        res.status(200).json({
        status: 'success',
        data: {
            product: product,
        },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.rejectProduct = async (req, res, next) => {
    try {
        const  product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.status !== 'pending') {
            return res.status(400).json({ message: 'Product status is not pending' });
        }
        await Product.updateOne({ _id: req.params.id }, { status: 'rejected' });
        await Product.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Product rejected and deleted' });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.getAcceptedProducts = async (req, res, next) => {
    const products = await Product.find({status: 'accepted'}).populate('owner', 'firstName lastName email images'); // only accepted supplies
    try {
        res.status(200).json({
            status: 'success',
            data: {
                products,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.searchProducts = async (req, res, next) => {
    try {
        const { query } = req.query;

        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ],
        });

        res.status(200).json({
            status: 'success',
            data: {
                products,
            },
        });
    } catch (err) {
        return next(err);
    }
};

exports.getOwnerDetails = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return next(new AppError(`Product not found`, 404));
        const owner = await User.findById(product.owner);
        res.status(200).json({
            status: 'success',
            data: {
                owner: owner,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
}

exports.getProductsByOwner = async (req, res, next) => {
    try {
        const products = await Product.find({ owner: req.user.id }).populate('owner', 'firstName lastName email images');

        res.status(200).json({
            status: 'success',
            data: {
                products: products,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

