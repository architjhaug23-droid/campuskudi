const Product = require('../models/Product');
const Category = require('../models/Category');

// Get all products with filtering and pagination
exports.getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort, page = 1, limit = 12 } = req.query;

    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        filter.category = cat._id;
      }
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Sorting
    let sortBy = {};
    if (sort === 'price-asc') sortBy = { price: 1 };
    if (sort === 'price-desc') sortBy = { price: -1 };
    if (sort === 'newest') sortBy = { createdAt: -1 };
    if (sort === 'rating') sortBy = { rating: -1 };

    // Pagination
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category');

    const total = await Product.countDocuments(filter);

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

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('category')
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name' }
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const skip = (page - 1) * limit;

    const products = await Product.find({ category: category._id })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category');

    const total = await Product.countDocuments({ category: category._id });

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

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { query, page = 1, limit = 12 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide search query'
      });
    }

    const skip = (page - 1) * limit;

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category');

    const total = await Product.countDocuments({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Search results retrieved successfully',
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
