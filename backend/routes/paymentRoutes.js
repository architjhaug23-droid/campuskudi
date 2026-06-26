const express = require('express');
const router = express.Router();
const {
  generateUPIQR,
  verifyPayment,
  getPaymentStatus,
  processCOD
} = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/upi/generate-qr', auth, generateUPIQR);
router.post('/upi/verify', auth, verifyPayment);
router.get('/status/:orderId', auth, getPaymentStatus);
router.post('/cod/process', auth, processCOD);

module.exports = router;
