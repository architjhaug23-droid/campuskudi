const Joi = require('joi');

// User validation
const validateUser = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(15).required(),
    password: Joi.string().min(6).required()
  });
  return schema.validate(data);
};

// Product validation
const validateProduct = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(2000).required(),
    price: Joi.number().min(0).required(),
    discount: Joi.number().min(0).max(100),
    images: Joi.array().items(Joi.string()),
    categoryId: Joi.string().required(),
    stock: Joi.number().min(0),
    sizes: Joi.array().items(Joi.string()),
    colors: Joi.array().items(Joi.string())
  });
  return schema.validate(data);
};

// Order validation
const validateOrder = (data) => {
  const schema = Joi.object({
    shippingAddress: Joi.object({
      name: Joi.string().required(),
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string().required(),
      country: Joi.string().required(),
      phone: Joi.string().required()
    }).required(),
    paymentMethod: Joi.string().valid('COD', 'UPI', 'Card', 'NetBanking').required(),
    couponCode: Joi.string().optional()
  });
  return schema.validate(data);
};

// Coupon validation
const validateCoupon = (data) => {
  const schema = Joi.object({
    code: Joi.string().min(3).max(20).required(),
    discount: Joi.number().min(0).max(100).required(),
    discountType: Joi.string().valid('percentage', 'fixed'),
    expiryDate: Joi.date().required(),
    minOrderValue: Joi.number().min(0),
    maxUses: Joi.number().min(1)
  });
  return schema.validate(data);
};

module.exports = {
  validateUser,
  validateProduct,
  validateOrder,
  validateCoupon
};
