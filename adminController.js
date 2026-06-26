const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const jwt = require('jsonwebtoken');

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin user (assuming email-based admin check)
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: 'admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ PRODUCT MANAGEMENT ============

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, images, categoryId, stock, sizes, colors } = req.body;

    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const product = new Product({
      name,
      description,
      price,
      discount: discount || 0,
      images: images || [],
      category: categoryId,
      stock: stock || 0,
      sizes: sizes || [],
      colors: colors || []
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all products (admin)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category');

    const total = await Product.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
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

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, discount, images, categoryId, stock, sizes, colors } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price }),
        ...(discount !== undefined && { discount }),
        ...(images && { images }),
        ...(categoryId && { category: categoryId }),
        ...(stock !== undefined && { stock }),
        ...(sizes && { sizes }),
        ...(colors && { colors }),
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ CATEGORY MANAGEMENT ============

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category name'
      });
    }

    const category = new Category({
      name,
      description,
      image
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(image && { image })
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ ORDER MANAGEMENT ============

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email phone')
      .populate('products.product')
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
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

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, trackingNumber } = req.body;

    if (!orderStatus && !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status to update'
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
        ...(trackingNumber && { trackingNumber }),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ USER MANAGEMENT ============

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
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

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ REVIEW MANAGEMENT ============

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments();

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
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update product
    const product = await Product.findById(review.product);
    product.reviews = product.reviews.filter(r => r.toString() !== id);
    product.totalReviews -= 1;
    await product.save();

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

// ============ COUPON MANAGEMENT ============

// Create coupon
exports.createCoupon = async (req, res) => {
  try {
    const { code, discount, discountType, expiryDate, minOrderValue, maxUses } = req.body;

    if (!code || !discount || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discount,
      discountType: discountType || 'percentage',
      expiryDate,
      minOrderValue: minOrderValue || 0,
      maxUses: maxUses || null
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ ANALYTICS ============

// Get dashboard analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();

    const orders = await Order.find({ paymentStatus: 'Paid' });
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const topProducts = await Order.aggregate([
      { $unwind: '$products' },
      { $group: { _id: '$products.product', totalSold: { $sum: '$products.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } }
    ]);

    // Monthly revenue
    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$totalAmount' }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: {
        totalSales: Math.round(totalSales),
        totalOrders,
        totalUsers,
        totalProducts,
        topProducts,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
