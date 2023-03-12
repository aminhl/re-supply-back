const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const userRouter = require('./routes/userRoutes');
const productRouter = require('./routes/productRoutes');
const feedbackRouter = require('./routes/feedbackRoutes');
const donationRouter = require('./routes/donationRoutes');
const orderRouter = require('./routes/orderRoutes');
const resourceRouter = require('./routes/resourceRoutes');
const requestRouter = require('./routes/requestRoutes');
const commentRouter = require('./routes/commentRoutes')
const articleRouter = require ('./routes/articleRoutes')
const exchangeRouter = require('./routes/exchangeRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
// Set the Access-Control-Allow-Origin header to allow requests from the origin of the Angular app
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// MIDDLEWARES
app.use(cors({
    credentials: true,
    origin: 'http://localhost:4200'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.get('/success', (req, res) => {
    res.send('Success');
});
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/feedbacks', feedbackRouter);
app.use('/api/v1/donations', donationRouter);
app.use('/api/v1/requests', requestRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/resources',resourceRouter );
app.use('/api/v1/comments',commentRouter );
app.use('/api/v1/articles',articleRouter );
app.use('/api/v1/exchanges', exchangeRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);


module.exports = app;
