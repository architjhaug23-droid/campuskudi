const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrder,
  trackOrder
} = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/create', auth, createOrder);
router.get('/my-orders', auth, getUserOrders);
router.get('/track/:orderId', trackOrder);
router.get('/:id', auth, getOrder);

module.exports = router;
