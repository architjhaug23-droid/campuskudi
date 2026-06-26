const Order = require('../models/Order');
const QRCode = require('qrcode');

// Generate UPI QR code
exports.generateUPIQR = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide order ID'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate UPI string
    const upiString = `upi://pay?pa=${process.env.UPI_ID}&pn=${process.env.MERCHANT_NAME}&am=${order.totalAmount}&tr=${order.orderNumber}&tn=CampusKudi%20Order%20${order.orderNumber}`;

    // Generate QR code
    const qrCode = await QRCode.toDataURL(upiString);

    res.status(200).json({
      success: true,
      message: 'UPI QR code generated successfully',
      data: {
        qrCode,
        upiString,
        amount: order.totalAmount,
        merchantName: process.env.MERCHANT_NAME,
        upiId: process.env.UPI_ID,
        orderId: order.orderNumber
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify payment (simulate)
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;

    if (!orderId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide order ID and transaction ID'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update payment status
    order.paymentStatus = 'Paid';
    order.orderStatus = 'Processing';
    order.upiTransactionId = transactionId;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount,
        transactionId: order.upiTransactionId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// COD Payment (Cash on Delivery)
exports.processCOD = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide order ID'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For COD, payment status remains Pending until delivery
    order.paymentStatus = 'Pending';
    order.orderStatus = 'Processing';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'COD order confirmed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
