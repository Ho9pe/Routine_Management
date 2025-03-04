const rateLimit = require('express-rate-limit');

// Rate limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 5 requests per windowMs for auth routes
    message: 'Too many attempts, please try again later'
});
// Rate limiter for other routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000 // 100 requests per windowMs for other routes
});

module.exports = { authLimiter, apiLimiter };