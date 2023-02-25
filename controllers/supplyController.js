const Supply = require('./../models/supplyModel');
const AppError = require('./../utils/appError');

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
    return next(new AppError(err, 500));
  }
};

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
    return next(new AppError(err, 500));
  }
};

exports.getSupply = async (req, res, next) => {
  try {
    const supply = await Supply.findById(req.params.id);
    if (!supply) return next(new AppError(`Supply not found`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        supply,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
exports.deleteSupply = async (req, res, next) => {
  try {
    const supply = await Supply.findByIdAndDelete(req.params.id);
    if (!supply) return next(new AppError(`Supply not found`, 404));
    res.status(204).json({
      status: 'success',
      message: 'Supply deleted',
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};
exports.updateSupply = async (req, res, next) => {
  try {
    const supply = await Supply.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supply) return next(new AppError(`Supply not found`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        supply,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
};

exports.getPendingSupplies = async (req, res, next) => {
    const supplies = await Supply.find({status: 'pending'}); // only pending supplies
    try {
        res.status(200).json({
            status: 'success',
            data: {
                supplies,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.acceptSupply = async (req, res, next) => {
    try {
        const supply = await Supply.findByIdAndUpdate(req.params.id, {status: 'accepted'}, {
        new: true,
        runValidators: true,
        });
        if (!supply) return next(new AppError(`Supply not found`, 404));
        res.status(200).json({
        status: 'success',
        data: {
            supply,
        },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.rejectSupply = async (req, res, next) => {
    try {
        const supply = await Supply.findById(req.params.id);
        if (!supply) {
            return res.status(404).json({ message: 'Supply not found' });
        }
        if (supply.status !== 'pending') {
            return res.status(400).json({ message: 'Supply status is not pending' });
        }
        await Supply.updateOne({ _id: req.params.id }, { status: 'rejected' });
        await Supply.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Supply rejected and deleted' });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};

exports.getAcceptedSupplies = async (req, res, next) => {
    const supplies = await Supply.find({status: 'accepted'}); // only accepted supplies
    try {
        res.status(200).json({
            status: 'success',
            data: {
                supplies,
            },
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
