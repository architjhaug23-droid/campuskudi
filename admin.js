const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Remove 'Bearer ' from token
    const tokenValue = token.replace('Bearer ', '');

    const decoded = jwt.verify(tokenValue, process.env.ADMIN_JWT_SECRET);
    req.admin = decoded;
    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Admin token is not valid'
    });
  }
};

const checkAdminRole = async (req, res, next) => {
  try {
    if (!req.admin || req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin role'
    });
  }
};

module.exports = { adminAuth, checkAdminRole };
