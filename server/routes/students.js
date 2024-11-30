const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');

// Get student profile
router.get('/profile', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ email: req.user.email }).select('-password');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update student profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { email, department, student_roll, full_name, semester } = req.body;
        
        // Convert semester to number if it exists
        const updateData = {
            email,
            department,
            student_roll,
            full_name,
            ...(semester && { semester: parseInt(semester) })
        };

        const student = await Student.findOneAndUpdate(
            { email: req.user.email },
            updateData,
            { new: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;