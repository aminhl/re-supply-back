const Product = require('../models/productModel');
const AppError = require('./../utils/appError');
const multer = require('multer');
const path = require('path');

// Set up the storage for uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

// Create the multer upload object
const upload = multer({ storage: storage });

// Controller to create a new product
exports.addProduct = [
    // Use multer middleware to handle the form data
    upload.array('images', 5),

    async (req, res, next) => {
        try {
            // Create a new product with the data from the request body
            const product = new Product({
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                images: req.files ? req.files.map((file) => `/uploads/${file.filename}`) : []
            });

            // Save the product to the database
            await product.save();

            res.status(201).json({
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

exports.getAllProducts = async (req, res, next) => {
  const products = await Product.find();
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

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
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
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
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

exports.getPendingProducts = async (req, res, next) => {
    const products = await Product.find({status: 'pending'}); // only pending supplies
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
    const products = await Product.find({status: 'accepted'}); // only accepted supplies
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
