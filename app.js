const express = require('express');
const morgan = require('morgan');

const app = express();

// MIDDLEWARES
app.use(express.json());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

module.exports = app;
