const Request = require('../models/requestModel');
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const path = require("path");
const {v4: uuidv4} = require("uuid");
const sendEmail = require("../utils/email");
const multer = require("multer");
const admin = require("firebase-admin");
const serviceAccount = require("../firebase/resupply-379921-2f0e7acb17e7.json");
const Product = require("../models/productModel");


// Initialize the Firebase Admin SDK only once
if (!admin.apps.length) {
    admin.initializeApp();
}
const bucket = admin.storage().bucket();

// Create the multer upload object
const upload = multer();

exports.addRequest = [
    // Use multer middleware to handle the form data
    upload.array("requestImage", 5),

    async (req, res, next) => {
        try {
            // Upload images to Firebase Cloud Storage
            const imageUrls = [];
            if (req.files) {
                for (const file of req.files) {
                    const extension = path.extname(file.originalname);
                    const filename = `${uuidv4()}${extension}`;
                    const fileRef = bucket.file(`requests/${filename}`);
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
                        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/requests%2F${filename}?alt=media&token=${FireBaseToken}`;
                        const imageUrlWithToken = await bucket
                            .file(`requests/${filename}`)
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
                            // Create the request
                            const newRequest = new Request({
                                requester_id: req.user.id,
                                type: req.body.type,
                                targetValue: req.body.targetValue,
                                currentValue: req.body.currentValue,
                                isApproved: false,
                                itemType: req.body.itemType,
                                requestTitle: req.body.requestTitle,
                                requestImage: imageUrls,
                                notes: req.body.notes,
                            });

                            // Save the request to the database
                            await newRequest.save();

                            // Populate the response with the requester details and images

                            res.status(201).json({
                                status: "success",
                                data: {
                                    request: newRequest,
                                },
                            });
                        }
                    });
                    stream.end(file.buffer);
                }
            } else {
                // Create a new request with the data from the request body
                const request = new Request({
                    requester_id: req.user.id,
                    type: req.body.type,
                    targetValue: req.body.targetValue,
                    currentValue: req.body.currentValue,
                    requestImage: [],
                    notes: req.body.notes,
                });

                // Save the request to the database
                await request.save();

                // Populate the response with the requester details and images
                const populatedRequest = await Request.findById(request._id)
                    .populate("requester_id", "firstName lastName email images")
                    .populate({
                        path: "requester_id",
                        populate: {
                            path: "images",
                        },
                    });

                res.status(201).json({
                    status: "success",
                    data: {
                        request: populatedRequest,
                    },
                });
            }
        } catch (err) {
            return next(err);
        }
    },
];


exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find().populate('requester_id');
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json(err);
    }
};


exports.getRequestById = async (req, res) => {
    try {
        const request = await Request.findById(req.params.requestId).populate('requester_id');
        if (!request) {
            return res.status(404).json({message: 'Request not found'});
        }
        res.status(200).json(request);
    } catch (err) {
        res.status(500).json(err);
    }
};


exports.updateRequest = async (req, res) => {
    try {
        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.requestId,
            {
                type: req.body.type,
                targetValue: req.body.targetValue,
                currentValue: req.body.currentValue,
                notes: req.body.notes,
            },
            {new: true}
        );
        if (!updatedRequest) {
            return res.status(404).json({message: 'Request not found'});
        }
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const deletedRequest = await Request.findByIdAndDelete(req.params.id);
        if (!deletedRequest) {
            return res.status(404).json({message: 'Request not found444'});
        }
        res.status(200).json(deletedRequest);
    } catch (err) {
        res.status(500).json(err);
    }

};

exports.approveRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);


        if (!request) {
            return res.status(404).json({message: 'Request not found'});
        }

        request.isApproved = true;
        await request.save();

        res.json(request);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};
