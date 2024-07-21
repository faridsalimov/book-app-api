const express = require('express');
const bookController = require('./../controllers/bookController');
const authController = require('./../controllers/authController');
const router = express.Router();

router
  .route('/')
  .get(authController.protect, bookController.getAllBooks)
  .post(authController.protect, bookController.createBook);

router
  .route('/:id')
  .get(authController.protect, bookController.getBook)
  .patch(authController.protect, bookController.updateBook)
  .delete(authController.protect, bookController.deleteBook);

module.exports = router;