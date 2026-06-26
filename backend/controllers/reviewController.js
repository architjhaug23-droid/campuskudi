const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Create review
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product ID and rating'
      });
    }

    // Check if user has purchased the product
    const order = await Order.findOne({
      user: req.userId,
      'products.product': productId,
      orderStatus: { $in: ['Delivered', 'Shipped'] }
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if review already exists
    let review = await Review.findOne({
      user: req.userId,
      product: productId
    });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      // Create new review
      review = new Review({
        user: req.userId,
        product: productId,
        rating,
        comment
      });
      await review.save();

      // Add review to product
      product.reviews.push(review._id);
      product.totalReviews += 1;
    }

    // Update product rating
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0) / allReviews.length;
    product.rating = Math.round(avgRating * 10) / 10;

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review created/updated successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get reviews for product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ product: productId });

    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const product = await Product.findById(review.product);
    product.reviews = product.reviews.filter(r => r.toString() !== reviewId);
    product.totalReviews -= 1;

    if (product.totalReviews > 0) {
      const allReviews = await Review.find({ product: review.product });
      const avgRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0) / allReviews.length;
      product.rating = Math.round(avgRating * 10) / 10;
    } else {
      product.rating = 0;
    }

    await product.save();
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
