const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  getProductsByCategory,
  searchProducts
} = require('../controllers/productController');

router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:id', getProduct);

module.exports = router;
