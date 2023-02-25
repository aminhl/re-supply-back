const Supply = require('./../models/supplyModel');

exports.addSupply = async (req, res, next) => {
    const supply = await Supply.create({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        quantity: req.body.quantity,
        image: req.body.image,
    });
    try {
        res.status(201).json({
        status: 'success',
        data: {
            supply,
        },
        });
    } catch (err) {
        res.status(500).json({
        status: 'error',
        message: err,
        });
    }
}

exports.getAllSupplies = async (req, res, next) => {
    const supplies = await Supply.find();
    try {
        res.status(200).json({
        status: 'success',
        data: {
            supplies,
        },
        });
    } catch (err) {
        res.status(500).json({
        status: 'error',
        message: err,
        });
    }
}

exports.getSupply = async (req, res, next) => {
    try {
        const supply = await Supply.findById(req.params.id);
        if (!supply) {
            return res.status(404).json({
                status: 'error',
                message: 'Supply not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                supply,
            },
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err,
        });
    }
};
exports.deleteSupply = async (req, res, next) => {
    try {
        const supply = await Supply.findByIdAndDelete(req.params.id);
        if (!supply) {
            return res.status(404).json({
                status: 'error',
                message: 'Supply not found',
            });
        }
        res.status(200).json({
            status: 'success',
            message: 'Supply deleted',
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err,
        });
    }
}
exports.updateSupply = async (req, res, next) => {
    try {
        const supply = await Supply.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!supply) {
            return res.status(404).json({
                status: 'error',
                message: 'Supply not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                supply,
            },
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err,
        });
    }
}