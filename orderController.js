const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide shipping address and payment method'
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    let subtotal = cart.subtotal;
    let discount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: Date.now() }
      });

      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discount = subtotal * (coupon.discount / 100);
        } else {
          discount = coupon.discount;
        }
        coupon.currentUses += 1;
        await coupon.save();
      }
    }

    const shippingCost = 148; // Default shipping cost
    const totalAmount = subtotal - discount + shippingCost;

    // Create order
    const order = new Order({
      user: req.userId,
      products: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        discount: item.product.discount,
        size: item.size,
        color: item.color
      })),
      shippingAddress,
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      subtotal,
      shippingCost,
      discount,
      totalAmount,
      ...(coupon && { coupon: coupon._id })
    });

    await order.save();

    // Update product stock
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear cart
    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('products.product')
      .populate('coupon');

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
      message: 'Order retrieved successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Track order
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderNumber: orderId }]
    }).populate('products.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order tracking retrieved successfully',
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        products: order.products,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        trackingNumber: order.trackingNumber
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
