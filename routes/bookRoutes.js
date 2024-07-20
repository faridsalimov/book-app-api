const express = require('express');
const bookController = require('./../controllers/bookController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.param('id', bookController.checkId);

router
  .route('/')
  .get(authController.protect, bookController.getAllBooks)
  .post(bookController.checkBody, bookController.createBook);

router
  .route('/:id')
  .get(bookController.getBook)
  .patch(bookController.updateBook)
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    bookController.deleteBook
  );

module.exports = router;