const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// =====================
// SECURITY MIDDLEWARE
// =====================
app.use(helmet());
app.use(mongoSanitize());

// =====================
// BODY PARSER MIDDLEWARE
// =====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =====================
// COMPREHENSIVE CORS CONFIGURATION
// =====================
const allowedOrigins = [
    // Development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5500',
    'http://localhost:5501',
    'http://localhost:8000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8080',
    // Production
    'http://campuskudi.com',
    'https://campuskudi.com',
    'http://www.campuskudi.com',
    'https://www.campuskudi.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, mobile apps, etc)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // If not allowed, log and reject
        console.warn(`⚠️  CORS request blocked from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'x-auth-token',
        'Access-Control-Allow-Credentials'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware BEFORE routes
app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

// =====================
// ADDITIONAL CORS HEADER MIDDLEWARE (FALLBACK)
// =====================
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // If origin is allowed or no origin, set headers
    if (!origin || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,x-auth-token');
    }
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// =====================
// RATE LIMITERS
// =====================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.'
    },
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// =====================
// HEALTH CHECK ROUTE
// =====================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// =====================
// API ROUTES
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// =====================
// 404 ROUTE
// =====================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use(errorHandler);

// =====================
// SERVER START
// =====================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📦 Environment: ${NODE_ENV}`);
    console.log(`\n🔐 Allowed Origins:`);
    allowedOrigins.forEach(origin => console.log(`   ✓ ${origin}`));
    console.log(`${'='.repeat(60)}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

module.exports = app;