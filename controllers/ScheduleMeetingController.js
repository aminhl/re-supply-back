const ScheduleMeetingController = require('../models/ScheduleMeetingModel');
const AppError = require('../utils/appError');


exports.addScheduleMeeting = async (req, res, next) => {
  const date = new Date(req.body.date);
  const schedulemeeting = await ScheduleMeetingController.create({
    user: req.user.id,
    title: req.body.title,
    description:req.body.description,
    date: date,
  });
  try {
    res.status(201).json({
      status: 'success',
      data: {
        schedulemeeting,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
}

exports.getAllScheduleMeeting = async (req, res, next) => {
  const schedulemeeting = await ScheduleMeetingController.find();
  try {
    res.status(200).json({
      status: 'success',
      data: {
        schedulemeeting,
      },
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
}
exports.findMeetWithIdUser= async (req, res, next) => {
  const iduser = req.body.user;

  const meets = await ScheduleMeetingController.find({user:iduser})
  if (meets.length === 0) {
    try {
      res.status(201).json({
        status: 'success',
        data: {
          result : 0,
        },
      });
    } catch (err) {
      return next(new AppError(err, 500));
    }
  }
  else
  {
    try {
      res.status(201).json({
        status: 'success',
        data: {
          result : meets,
        },
      });
    } catch (err) {
      return next(new AppError(err, 500));
    }
  }
}
