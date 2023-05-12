require("dotenv").config();
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const AppError = require("../utils/appError");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishListModel");
const Request = require("../models/requestModel");


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
        currency: "usd",
        unit_amount: product.price * 100,
        product_data: {
          name: product.name,
          description: product.description,
          images: [product.images[0]],
        },
      },
      quantity: products[index].quantity || 1,
    }));

    // Get the seller's stripe account id
    const seller = await User.findById(productData[0].owner);
    const sellerStripeAccountId = seller.stripeAccountId;

    // Create a Checkout Session with the line items and seller's Stripe account id
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      payment_intent_data: {
        application_fee_amount: lineItems.reduce(
            (total, item) =>
                total + item.price_data.unit_amount * item.quantity * 0.1,
            0
        ),
        transfer_data: {
          destination: sellerStripeAccountId,
        },
      },
      mode: "payment",
      success_url: "http://localhost:4200/orderSuccess",
      cancel_url: "http://localhost:4200/cart",
    });

    // Update the status of each product to "sold"
    for (let i = 0; i < products.length; i++) {
      await Product.findByIdAndUpdate(products[i].product, {
        status: "sold",
      });
    }

    // Reset the cart if it exists
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.products = [];
      await cart.save();
    }

    // Reset the wishlist if it exists
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.status(201).json({
      status: "success",
      data: {
        order,
        session_id: session.id,
        session_url: session.url,
      },
    });
  } catch (err) {
    return next(err);
  }
};
exports.createSingleOrder = async (req, res, next) => {
  try {
    const productId = req.body.productId;
    const product = await Product.findById(productId);
    console.log(product);
    console.log(productId)

    // Create new order
    const order = await Order.create({
      products: { product: product },
      user: req.user.id,
    });

    // Create line item for product
    const lineItem = {
      price_data: {
        currency: "usd",
        unit_amount: product.price * 100,
        product_data: {
          name: product.name,
          description: product.description,
          images: [product.images[0]],
        },
      },
      quantity: 1,
    };

    // Get the seller's stripe account id
    const seller = await User.findById(product.owner);
    const sellerStripeAccountId = seller.stripeAccountId;

    // Create a Checkout Session with the line item and seller's Stripe account id
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [lineItem],
      payment_intent_data: {
        application_fee_amount: lineItem.price_data.unit_amount * lineItem.quantity * 0.1,
        transfer_data: {
          destination: sellerStripeAccountId,
        },
      },
      mode: "payment",
      success_url: "http://localhost:4200/orderSuccess",
      cancel_url: "http://localhost:4200/products",
    });

    // Update the status of the product to "sold"
    await Product.findByIdAndUpdate(productId, {
      status: "sold",
    });

    // Reset the cart if it exists
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.products = [];
      await cart.save();
    }

    // Reset the wishlist if it exists
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.status(201).json({
      status: "success",
      data: {
        order,
        session_id: session.id,
        session_url: session.url,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("products.product");

    res.status(200).json({
      status: "success",
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
      status: "success",
      data: {
        order,
      },
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }

    res.status(200).json({
      status: "success",
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
    const isValid = products.every(({ price }) => !isNaN(price));
    if (!isValid) {
      throw new Error("Invalid product data");
    }

    // Calculate total price based on products
    const totalPrice = products.reduce((acc, curr) => acc + curr.price, 0);

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
      status: "success",
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
};

exports.donate = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const requestId = req.params.requestId;

    // Find the request and the user making the donation
    const request = await Request.findById(requestId);
    const donor = await User.findById(req.user.id);

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found',
      });
    }

    // Get the Stripe account IDs for the request owner and donor
    const requestOwner = await User.findById(request.requester_id);
    const requestOwnerAccountId = requestOwner?.stripeAccountId;
    const donorAccountId = donor?.stripeAccountId;

    if (!requestOwnerAccountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Request owner Stripe account ID not found',
      });
    }

    if (!donorAccountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Donor Stripe account ID not found',
      });
    }

    // Create a Checkout Session with the donation amount and request owner's Stripe account ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount * 100,
            product_data: {
              name: requestOwner.firstName + ' ' + requestOwner.lastName,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: amount * 100 * 0.1, // 10% fee for the platform
        transfer_data: {
          destination: requestOwnerAccountId,
        },
      },
      mode: 'payment',
      success_url: 'http://localhost:4200/orderSuccess',
      cancel_url: 'http://localhost:4200/donation/',
    });
    // Update the request's current value and save it to the database
    request.currentValue += +amount;
    await request.save();
    res.status(201).json({
      status: 'success',
      data: {
        session_url: session.url,
      },
    });
  } catch (err) {
    return next(err);
  }
};



