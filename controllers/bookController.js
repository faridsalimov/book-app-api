const Book = require('./../models/bookModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

exports.checkBody = (req, res, next) => {
  if (!req.body.title || !req.body.author || !req.body.price || !req.body.discount || !req.body.publishDate || !req.body.imageLink) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing field.',
    });
  }
  next();
};

exports.createBook = catchAsync(async (req, res) => {
  const newBook = await Book.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      book: newBook,
    },
  });
});

exports.getAllBooks = catchAsync(async (req, res) => {
  const features = new APIFeatures(Book.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const books = await features.query;

  res.status(200).json({
    status: 'success',
    results: books.length,
    data: {
      books,
    },
  });
});

exports.getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book){
    return next(new AppError('Book was not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: book,
  });
});

exports.updateBook = catchAsync(async (req, res, next) => {
  const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedBook){
    return next(new AppError('Book was not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      updatedBook,
    },
  });
});

exports.deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book){
    return next(new AppError('Book was not found.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: {
      message: 'Book has been deleted.',
    },
  });
});