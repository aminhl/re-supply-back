const ParticipationEvents = require('../models/ParticipationEvents');
const AppError = require('../utils/appError');
const EventModels = require("../models/ParticipationEvents");
exports.addEvents = async (req, res, next) => {
  const date = req.body.eventDate;
  const title = req.body.eventTitle;
  const description = req.body.eventDescription;
  const events = await EventModels.find({eventTitle: title, eventDescription: description});
  if (events.length === 0) {
    const email = req.user.email; // Get user email from req object
    const date = req.body.eventDate;

    const ParticipationEvent = await ParticipationEvents.create({
      eventTitle: title,
      eventDescription: description,
      eventDate: date,
      Eventusers: [email], // Include user email in the array
    });
    try {
      res.status(201).json({
        status: 'success',
        data: {
          ParticipationEvent,
        },
      });
    } catch (err) {
      return next(new AppError(err, 500));
    }
  } else {
    const email = req.user.email;
    const existingEvent = events[0];
    if (existingEvent.Eventusers.includes(email)) {
    } else {
      try {
        existingEvent.Eventusers.push(email);
        await existingEvent.save();
        res.status(201).json({
          status: 'success',
        });
      } catch (err) {
        return next(new AppError(err, 500));
      }

    }
  }
};
exports.Checkuserevents = async (req, res, next) => {
  const date = req.body.eventDate;
  const title = req.body.eventTitle;
  const description = req.body.eventDescription;
  const email = req.user.email;
  const events = await EventModels.find({Eventusers: email,eventTitle:title,eventDescription:description});
  if (events.length === 0) {
    try {
      res.status(201).json({
        status: 'success',
        data: {
          result : false,
        },
      });
    } catch (err) {
      return next(new AppError(err, 500));
    }
  }else
  {
    try {
      res.status(201).json({
        status: 'success',
        data: {
          result : true,
        },
      });
    } catch (err) {
      return next(new AppError(err, 500));
    }
  }
}
exports.getEmailsForEvent = async (req, res, next) => {
  const title = req.body.eventTitle;
  const description = req.body.eventDescription;
  const events = await EventModels.find({eventTitle:title,eventDescription:description});
  if (events.length === 0) {
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
          result : events[0].Eventusers,
        },
      });
    } catch (err) {
      return next(new AppError(err, 500));
    }
  }
  }


