const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide title.'],
  },
  author: {
    type: String,
    required: [true, 'Please provide author.'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide price.'],
  },
  discount: {
    type: Number,
    required: [true, 'Please provide discount.'],
  },
  page: {
    type: Number,
    required: [true, 'Please provide page.'],
  },
  publishDate: {
    type: Date,
    required: [true, 'Please provide discount.'],
  },
  imageLink: {
    type: String,
    required: [true, 'Please provide image link.'],
  }
});

module.exports = mongoose.model('Book', bookSchema);