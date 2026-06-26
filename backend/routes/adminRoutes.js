const express = require('express');
const router = express.Router();
const { adminAuth, checkAdminRole } = require('../middleware/admin');
const {
  adminLogin,
  createProduct,
  getAllProductsAdmin,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  deleteUser,
  getAllReviews,
  deleteReviewAdmin,
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  getAnalytics
} = require('../controllers/adminController');

// Admin Login
router.post('/login', adminLogin);

// Protected Admin Routes
router.use(adminAuth, checkAdminRole);

// ============ PRODUCTS ============
router.post('/products', createProduct);
router.get('/products', getAllProductsAdmin);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// ============ CATEGORIES ============
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ============ ORDERS ============
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// ============ USERS ============
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// ============ REVIEWS ============
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReviewAdmin);

// ============ COUPONS ============
router.post('/coupons', createCoupon);
router.get('/coupons', getAllCoupons);
router.delete('/coupons/:id', deleteCoupon);

// ============ ANALYTICS ============
router.get('/analytics', getAnalytics);

module.exports = router;
