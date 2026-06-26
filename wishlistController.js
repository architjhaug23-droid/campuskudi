const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.userId }).populate('products');

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.userId, products: [] });
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully',
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product ID'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.userId, products: [] });
    }

    // Check if product already in wishlist
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.products = wishlist.products.filter(
      product => product.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully',
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
