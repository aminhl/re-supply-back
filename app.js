const express = require('express');
const morgan = require('morgan');
const userRouter = require('./routes/userRoutes');
const supplyRouter = require('./routes/supplyRoutes');
const feedbackRouter = require('./routes/feedbackRoutes');
const donationRouter = require('./routes/donationRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// MIDDLEWARES
app.use(express.json());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/v1/users', userRouter);
app.use('/api/v1/supplies', supplyRouter);
app.use('/api/v1/feedbacks', feedbackRouter);
app.use('/api/v1/donations', donationRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
