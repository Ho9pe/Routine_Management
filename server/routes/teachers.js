const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Teacher = require('../models/Teacher');

// Get teacher profile
router.get('/profile', auth, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ teacher_id: req.user.id }).select('-password');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update teacher profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { full_name, academic_rank, department, contact_info } = req.body;
        const teacher = await Teacher.findOneAndUpdate(
            { teacher_id: req.user.id },
            { full_name, academic_rank, department, contact_info },
            { new: true }
        ).select('-password');
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;