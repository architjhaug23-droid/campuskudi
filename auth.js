const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
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

    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = auth;
