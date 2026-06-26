const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  deleteReview
} = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.post('/', auth, createReview);
router.get('/:productId', getProductReviews);
router.delete('/:reviewId', auth, deleteReview);

module.exports = router;
