const crypto = require('crypto');

// Generate unique order number
const generateOrderNumber = () => {
  return `CK${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
};

// Generate reset token
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  return { resetToken, resetTokenHash };
};

// Calculate discount
const calculateDiscount = (originalPrice, discountPercentage) => {
  return (originalPrice * discountPercentage) / 100;
};

// Calculate final price
const calculateFinalPrice = (originalPrice, discountPercentage) => {
  const discount = calculateDiscount(originalPrice, discountPercentage);
  return originalPrice - discount;
};

// Calculate subtotal
const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => {
    const finalPrice = calculateFinalPrice(item.price, item.discount);
    return sum + finalPrice * item.quantity;
  }, 0);
};

// Format currency
const formatCurrency = (amount) => {
  return `₹${amount.toFixed(2)}`;
};

// Check if product is in stock
const isInStock = (stock, quantity) => {
  return stock >= quantity;
};

module.exports = {
  generateOrderNumber,
  generateResetToken,
  calculateDiscount,
  calculateFinalPrice,
  calculateSubtotal,
  formatCurrency,
  isInStock
};
