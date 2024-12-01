// server/src/config/auth.js
const jwt = require('jsonwebtoken');

const authConfig = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: '24h',
    COOKIE_EXPIRE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

    // Generate JWT Token
    generateToken: (userId, role) => {
        return jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    },

    // Cookie options
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },

    // Password reset token expiry
    RESET_TOKEN_EXPIRE: 10 * 60 * 1000, // 10 minutes

    // Role levels for authorization
    roles: {
        ADMIN: 'admin',
        TEACHER: 'teacher',
        STUDENT: 'student'
    },

    // Validation constants
    validation: {
        PASSWORD_MIN_LENGTH: 6,
        STUDENT_ROLL_REGEX: /^\d{7}$/,
        TEACHER_ID_REGEX: /^TCSE-\d{4}$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
};

module.exports = authConfig;