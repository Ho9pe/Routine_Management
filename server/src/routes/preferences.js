const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TeacherPreference = require('../models/TeacherPreference');

// Get teacher preferences
router.get('/', auth, async (req, res) => {
    try {
        const preferences = await TeacherPreference.find({ teacher_id: req.user.id })
            .populate('course_id');
        res.json(preferences);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add preference
router.post('/', auth, async (req, res) => {
    try {
        const preference = new TeacherPreference({
            ...req.body,
            teacher_id: req.user.id
        });
        await preference.save();
        res.status(201).json(preference);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete preference
router.delete('/:id', auth, async (req, res) => {
    try {
        await TeacherPreference.findOneAndDelete({
            _id: req.params.id,
            teacher_id: req.user.id
        });
        res.json({ message: 'Preference removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;