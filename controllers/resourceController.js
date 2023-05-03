const Resource = require('../models/resourcesModel');
const AppError = require('./../utils/appError');
const multer = require('multer');

const path = require("path");
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

// Controller to create a new resource
exports.addResource = [
    // Use multer middleware to handle the form data
    upload.fields([
        { name: "files", maxCount: 5 },
        { name: "image", maxCount: 1 },
    ]),

    async (req, res, next) => {
        try {
            // Upload files to Firebase Cloud Storage
            const fileUrls = [];
            let imageUrl;
            if (req.files.files) {
                for (const file of req.files.files) {
                    const extension = path.extname(file.originalname);
                    const filename = `${uuidv4()}${extension}`;
                    const fileRef = bucket.file(`resources/${filename}`);
                    const stream = fileRef.createWriteStream({
                        metadata: {
                            contentType: file.mimetype,
                        },
                    });
                    stream.on("error", (err) => {
                        console.log("Error uploading file: ", err);
                    });
                    stream.on("finish", async () => {
                        const FireBaseToken = uuidv4();
                        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/resources%2F${filename}?alt=media&token=${FireBaseToken}`;
                        const fileUrlWithToken = await bucket
                          .file(`resources/${filename}`)
                          .getSignedUrl({
                              action: "read",
                              expires: "03-17-2024",
                              virtualHostedStyle: true,
                              query: {
                                  alt: "media",
                                  token: FireBaseToken,
                              },
                          });
                        fileUrls.push(fileUrlWithToken[0]);
                        if (
                          fileUrls.length === req.files.files.length &&
                          (!req.files.image || fileUrls.length > 0)
                        ) {
                            // Create a new resource with the data from the request body
                            const resource = new Resource({
                                title: req.body.title,
                                description: req.body.description,
                                files: fileUrls,
                                image: imageUrl,
                                user:req.user.id,
                                status: req.user.role === "admin" ? "accepted" : "pending",
                            });

                            // Save the resource to the database
                            await resource.save();

                            // Populate the response with the owner details, files and image
                            res.status(201).json({
                                status: "success",
                            });
                        }
                    });
                    stream.end(file.buffer);
                }
            }
            if (req.files.image) {
                const extension = path.extname(req.files.image[0].originalname);
                const filename = `${uuidv4()}${extension}`;
                const fileRef = bucket.file(`resources/${filename}`);
                const stream = fileRef.createWriteStream({
                    metadata: {
                        contentType: req.files.image[0].mimetype,
                    },
                });
                stream.on("error", (err) => {
                    console.log("Error uploading file: ", err);
                });
                stream.on("finish", async () => {
                    const FireBaseToken = uuidv4();
                    imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/resources%2F${filename}?alt=media&token=${FireBaseToken}`;
                    const imageUrlWithToken = await bucket
                      .file(`resources/${filename}`)
                      .getSignedUrl({
                          action: "read",
                          expires: "03-17-2024",
                          virtualHostedStyle: true,
                          query: {
                              alt: "media",
                              token: FireBaseToken,
                          },
                      });
                    imageUrl = imageUrlWithToken[0];
                    if (fileUrls.length === req.files.files.length) {
// Create a new resource with the data from the request body
                        const resource = new Resource({
                            title: req.body.title,
                            description: req.body.description,
                            files: fileUrls,
                            image: imageUrl,
                            user:req.user.id,
                            status: req.user.role === "admin" ? "accepted" : "pending",
                        });
                        // Save the resource to the database
                        await resource.save();

                        // Populate the response with the owner details, files and image
                        res.status(201).json({
                            status: "success",
                        });
                    }
                });
                stream.end(req.files.image[0].buffer);
            }
        } catch (err) {
            next(err);
        }
    },
];
    exports.getAllResources = async (req, res, next) => {
    const resources = await Resource.find();
    try {
        res.status(200).json({
            status: 'success',
            data: {
                resources: resources,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.getResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return next(new AppError(`Resource not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                resource: resource,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.deleteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) return next(new AppError(`Resource not found`, 404));
        res.status(204).json({
            status: 'success',
            message: 'Resource deleted',
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.updateResource = [
    // Use multer middleware to handle the form data
    upload.fields([
        { name: "files", maxCount: 5 },
        { name: "image", maxCount: 1 },
    ]),

    async (req, res, next) => {
        try {
            // Find the resource to update by ID
            const resource = await Resource.findById(req.params.id);

            if (!resource) {
                return next(new AppError('Resource not found', 404));
            }

            // Delete the previous image from Firebase Cloud Storage if it exists
            if (typeof resource.image === "string") {
                const filename = resource.image.split('/').pop();
                await bucket.file(`resources/${filename}`).delete();
            }

            // Upload new files to Firebase Cloud Storage
            const fileUrls = [];
            let imageUrl;
            if (req.files.files) {
                for (const file of req.files.files) {
                    const extension = path.extname(file.originalname);
                    const filename = `${uuidv4()}${extension}`;
                    const fileRef = bucket.file(`resources/${filename}`);
                    const stream = fileRef.createWriteStream({
                        metadata: {
                            contentType: file.mimetype,
                        },
                    });
                    stream.on("error", (err) => {
                        console.log("Error uploading file: ", err);
                    });
                    stream.on("finish", async () => {
                        const FireBaseToken = uuidv4();
                        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/resources%2F${filename}?alt=media&token=${FireBaseToken}`;
                        const fileUrlWithToken = await bucket
                          .file(`resources/${filename}`)
                          .getSignedUrl({
                              action: "read",
                              expires: "03-17-2024",
                              virtualHostedStyle: true,
                              query: {
                                  alt: "media",
                                  token: FireBaseToken,
                              },
                          });
                        fileUrls.push(fileUrlWithToken[0]);
                        if (
                          fileUrls.length === req.files.files.length &&
                          (!req.files.image || imageUrl)
                        ) {
                            // Update the resource with the new data
                            resource.title = req.body.title;
                            resource.description = req.body.description;
                            resource.files = fileUrls;
                            resource.image = imageUrl;

                            // Save the updated resource to the database
                            await resource.save();

                            // Populate the response with the updated resource details
                            res.status(200).json({
                                status: 'success',
                                data: {
                                    resource
                                }
                            });
                        }
                    });
                    stream.end(file.buffer);
                }
            }
            if (req.files.image) {
                const extension = path.extname(req.files.image[0].originalname);
                const filename = `${uuidv4()}${extension}`;
                const fileRef = bucket.file(`resources/${filename}`);
                const stream = fileRef.createWriteStream({
                    metadata: {
                        contentType: req.files.image[0].mimetype,
                    },
                });
                stream.on("error", (err) => {
                    console.log("Error uploading file: ", err);
                });
                stream.on("finish", async () => {
                    const FireBaseToken = uuidv4();
                    imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/resources%2F${filename}?alt=media&token=${FireBaseToken}`;
                    const imageUrlWithToken = await bucket
                      .file(`resources/${filename}`)
                      .getSignedUrl({
                          action: "read",
                          expires: "03-17-2024",
                          virtualHostedStyle: true,
                          query: {
                              alt: "media",
                              token: FireBaseToken,
                          },
                      });
                    imageUrl = imageUrlWithToken[0];
                    if (
                      fileUrls.length === (req.files.files ? req.files.files.length : 0) &&
                      imageUrl
                    ) {
// Update the resource with the new data
                        resource.title = req.body.title;
                        resource.description = req.body.description;
                        resource.files = fileUrls;
                        resource.image = imageUrl;

                        // Save the updated resource to the database
                        await resource.save();

                        // Populate the response with the updated resource details
                        res.status(200).json({
                            status: 'success',
                            data: {
                                resource
                            }
                        });
                    }
                });
                stream.end(req.files.image[0].buffer);
            }
            if (!req.files.files && !req.files.image) {
                // Update the resource with the new data
                resource.title = req.body.title;
                resource.description = req.body.description;

                // Save the updated resource to the database
                await resource.save();

                // Populate the response with the updated resource details
                res.status(200).json({
                    status: 'success',
                    data: {
                        resource
                    }
                });
            }
        } catch (error) {
            next(error);
        }
    }
];


                        exports.getPendingResource = async (req, res, next) => {
    const resources = await Resource.find({status: 'pending'}); // only pending postResource
    try {
        res.status(200).json({
            status: 'success',
            data: {
                resources: resources,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.acceptResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, {status: 'accepted'}, {
            new: true,
            runValidators: true,
        });
        if (!resource) return next(new AppError(`Resource not found`, 404));
        res.status(200).json({
            status: 'success',
            data: {
                resource: resource,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.rejectResource = async (req, res, next) => {
    try {
        const  resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        if (resource.status !== 'pending') {
            return res.status(400).json({ message: 'Resource status is not pending' });
        }
        await Resource.updateOne({ _id: req.params.id }, { status: 'rejected' });
        await Resource.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Resource rejected and deleted' });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
exports.getAcceptedResources = async (req, res, next) => {
    const resources = await Resource.find({status: 'accepted'}); // only accepted postResource
    try {
        res.status(200).json({
            status: 'success',
            data: {
                resources,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};


