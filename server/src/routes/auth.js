const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const { register, login } = require('../controllers/authController');
const { validateRegistration } = require('../middleware/validate');
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Define routes
router.post('/register', validateRegistration, register);
router.post('/login', login);
// Add password reset route
router.post('/reset-password', auth, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }
        // Hash the new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        // Update password based on user role
        if (req.user.role === 'student') {
            await Student.findByIdAndUpdate(req.user.id, {
                password: hashedPassword
            });
        } else if (req.user.role === 'teacher') {
            await Teacher.findByIdAndUpdate(req.user.id, {
                password: hashedPassword
            });
        }
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

module.exports = router;