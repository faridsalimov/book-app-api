const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const bookRoutes = require('./routes/bookRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
const path = require('path');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.headers);
  next();
});

app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

app.use(globalErrorHandler);

module.exports = app;