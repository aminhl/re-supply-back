const Request = require('../models/requestModel');


exports.createRequest = async (req, res) => {
    try {
        const newRequest = new Request({
            requester_id: req.body.requester_id,
            type: req.body.type,
            targetValue: req.body.targetValue,
            notes: req.body.notes,
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json(err);
    }
};

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
