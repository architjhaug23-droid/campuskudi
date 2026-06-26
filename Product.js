const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: 2000
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  images: [
    {
      type: String,
      required: true
    }
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide a category']
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: 0,
    default: 0
  },
  sizes: [
    {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    }
  ],
  colors: [String],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  totalReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
