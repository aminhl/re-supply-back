const Request = require('../models/requestModel');
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const path = require("path");
const {v4: uuidv4} = require("uuid");
const sendEmail = require("../utils/email");
const multer = require("multer");
const upload = multer();



exports.addRequest = [
    // Use multer middleware to handle the form data
    upload.array('requestImages', 2),
    async (req, res, next) => {
        try {
            // Get the user who is making the request
            const user = await User.findById(req.user.id);
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
                    stream.on('error', (err) => {
                        console.log('Error uploading image: ', err);
                    });
                    stream.on('finish', async () => {
                        const FireBaseToken = uuidv4();
                        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/requests%2F${filename}?alt=media&token=${FireBaseToken}`;
                        const imageUrlWithToken = await bucket
                            .file(`requests/${filename}`)
                            .getSignedUrl({
                                action: 'read',
                                expires: '03-17-2024',
                                virtualHostedStyle: true,
                                query: {
                                    alt: 'media',
                                    token: FireBaseToken,
                                },
                            });
                        imageUrls.push(imageUrlWithToken[0]);
                        if (imageUrls.length === req.files.length) {
                            // Create the request
                            const newRequest = new Request({
                                requester_id: user._id,
                                type: req.body.type,
                                targetValue: req.body.targetValue,
                                currentValue: req.body.currentValue,
                                requestImage: imageUrls,
                                postedAt: new Date(),
                                notes: req.body.notes,
                            });
                            await newRequest.save();
                            res.status(201).json({
                                status: 'success',
                                data: {
                                    request: newRequest,
                                },
                            });
                        }
                    });
                    stream.end(file.buffer);
                }
            } else {
                // Create the request without images
                const newRequest = new Request({
                    requester_id: user._id,
                    type: req.body.type,
                    targetValue: req.body.targetValue,
                    currentValue: req.body.currentValue,
                    postedAt: new Date(),
                    notes: req.body.notes,
                });
                await newRequest.save();
                res.status(201).json({
                    status: 'success',
                    data: {
                        request: newRequest,
                    },
                });
            }
        } catch (err) {
            console.log(err);
            return next(new AppError('Unable to add request', 500));
        }
    },
];



// exports.createRequest = async (req, res) => {
//     try {
//         const newRequest = new Request({
//             requester_id: req.body.requester_id,
//             type: req.body.type,
//             targetValue: req.body.targetValue,
//             notes: req.body.notes,
//         });
//
//         const savedRequest = await newRequest.save();
//         res.status(201).json(savedRequest);
//     } catch (err) {
//         res.status(500).json(err);
//     }
// };

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
            return res.status(404).json({ message: 'Request not found' });
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
            { new: true }
        );
        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json(err);
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const deletedRequest = await Request.findByIdAndDelete(req.params.requestId);
        if (!deletedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(200).json(deletedRequest);
    } catch (err) {
        res.status(500).json(err);
    }
};
